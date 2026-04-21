using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Import;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Domain.Interfaces;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IImportService
{
    Task<(IEnumerable<ImportReceiptDto> Items, int TotalCount)> GetImportsAsync(ImportFilterDto filter, CancellationToken ct = default);
    Task<ImportReceiptDto?> GetImportByIdAsync(Guid id, CancellationToken ct = default);
    Task<ImportReceiptDto> CreateImportAsync(CreateImportReceiptDto dto, CancellationToken ct = default);
    Task UpdateImportAsync(Guid id, UpdateImportReceiptDto dto, CancellationToken ct = default);
    Task DeleteImportAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<ImportMonthlyStatsDto>> GetMonthlyStatsAsync(int months = 12, CancellationToken ct = default);
}

public class ImportService : IImportService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public ImportService(ApplicationDbContext context, IStorageService storageService, INotificationService notificationService)
    {
        _context = context;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    public async Task<(IEnumerable<ImportReceiptDto> Items, int TotalCount)> GetImportsAsync(ImportFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.ImportReceipts
            .Include(i => i.Warehouse)
            .Include(i => i.Creator)
            .Include(i => i.ImportDetails)
                .ThenInclude(d => d.Product)
            .Include(i => i.ImportDetails)
                .ThenInclude(d => d.IndividualEquipments)
            .AsQueryable();

        if (filter.WarehouseId.HasValue)
            query = query.Where(i => i.WarehouseId == filter.WarehouseId.Value);

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(i => i.ReceiptCode.ToLower().Contains(s)
                || (i.Note != null && i.Note.ToLower().Contains(s)));
        }

        if (filter.Status.HasValue)
            query = query.Where(i => i.Status == filter.Status.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(i => i.ImportDate >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(i => i.ImportDate <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var imports = await query
            .OrderByDescending(i => i.ImportDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<ImportReceiptDto>();
        foreach (var i in imports)
            dtos.Add(await MapToDtoAsync(i));

        return (dtos, totalCount);
    }

    public async Task<ImportReceiptDto?> GetImportByIdAsync(Guid id, CancellationToken ct = default)
    {
        var import = await _context.ImportReceipts
            .Include(i => i.Warehouse)
            .Include(i => i.Creator)
            .Include(i => i.ImportDetails)
                .ThenInclude(d => d.Product)
            .Include(i => i.ImportDetails)
                .ThenInclude(d => d.IndividualEquipments)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        return import == null ? null : await MapToDtoAsync(import);
    }

    public async Task<ImportReceiptDto> CreateImportAsync(CreateImportReceiptDto dto, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            // Generate receipt code: PN-YYYYMMDD-XXX
            var today = DateTime.UtcNow;
            var prefix = $"PN-{today:yyyyMMdd}-";
            var countToday = await _context.ImportReceipts
                .CountAsync(i => i.ImportDate.Date == today.Date, ct);
            var receiptCode = $"{prefix}{(countToday + 1):D3}";

            // Upload invoice file if provided
            string? invoiceFilePath = null;
            if (dto.InvoiceFileUpload != null)
            {
                using var stream = dto.InvoiceFileUpload.OpenReadStream();
                invoiceFilePath = await _storageService.UploadFileAsync(
                    stream, dto.InvoiceFileUpload.FileName, dto.InvoiceFileUpload.ContentType);
            }

            var import = new ImportReceipt
            {
                Id = Guid.NewGuid(),
                ReceiptCode = receiptCode,
                WarehouseId = dto.WarehouseId,
                CreatedBy = dto.CreatedBy,
                ImportDate = DateTime.UtcNow,
                InvoiceFile = invoiceFilePath,
                Note = dto.Note,
                Status = ReceiptStatus.Completed
            };

            await _context.ImportReceipts.AddAsync(import, ct);

            foreach (var detailDto in dto.Details)
            {
                var product = await _context.Products.FindAsync(new object[] { detailDto.ProductId }, ct);
                if (product == null) throw new ArgumentException($"Sản phẩm ID {detailDto.ProductId} không tồn tại.");

                var detail = new ImportDetail
                {
                    Id = Guid.NewGuid(),
                    ImportId = import.Id,
                    ProductId = detailDto.ProductId,
                    Quantity = detailDto.Quantity,
                    Price = detailDto.Price
                };
                await _context.ImportDetails.AddAsync(detail, ct);

                // Create individual equipment records if serials provided
                if (detailDto.SerialNumbers != null && detailDto.SerialNumbers.Any())
                {
                    for (int j = 0; j < detailDto.SerialNumbers.Count; j++)
                    {
                        var serial = detailDto.SerialNumbers[j];
                        var mac = (detailDto.MacAddresses != null && j < detailDto.MacAddresses.Count) 
                            ? detailDto.MacAddresses[j] 
                            : string.Empty;

                        var equipment = new IndividualEquipment
                        {
                            Id = Guid.NewGuid(),
                            ProductId = product.Id,
                            SerialNumber = serial,
                            MacAddress = mac,
                            Status = EquipmentStatus.InStock,
                            WarehouseId = import.WarehouseId,
                            ImportDetailId = detail.Id,
                            WarrantyExpiry = detailDto.WarrantyMonths > 0 
                                ? import.ImportDate.AddMonths(detailDto.WarrantyMonths) 
                                : null,
                            CreatedAt = DateTime.UtcNow
                        };
                        await _context.Set<IndividualEquipment>().AddAsync(equipment, ct);
                    }
                }

                product.Quantity += detailDto.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                var log = new InventoryLog
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ActionType = InventoryActionType.Import,
                    Quantity = detailDto.Quantity,
                    UserId = dto.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.InventoryLogs.AddAsync(log, ct);
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            // Reload full data
            var created = (await GetImportByIdAsync(import.Id, ct))!;

            // Gửi notification cho admin/manager
            var admins = await _context.Users
                .Where(u => u.Role.Code == "ADMIN" || u.Role.Code == "WAREHOUSE_MANAGER")
                .Select(u => u.Id)
                .ToListAsync(ct);

            foreach (var adminId in admins)
            {
                await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto(
                    adminId,
                    "Phiếu nhập kho mới",
                    $"Phiếu nhập {receiptCode} vừa được tạo với {dto.Details.Count} mặt hàng.",
                    Domain.Enums.NotificationType.System,
                    $"/imports/{import.Id}",
                    import.Id,
                    "ImportReceipt"
                ), ct);
            }

            return created;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task UpdateImportAsync(Guid id, UpdateImportReceiptDto dto, CancellationToken ct = default)
    {
        var import = await _context.ImportReceipts.FindAsync(new object[] { id }, ct);
        if (import == null) throw new ArgumentException("Không tìm thấy phiếu nhập.");

        if (dto.InvoiceFileUpload != null)
        {
            using var stream = dto.InvoiceFileUpload.OpenReadStream();
            import.InvoiceFile = await _storageService.UploadFileAsync(
                stream, dto.InvoiceFileUpload.FileName, dto.InvoiceFileUpload.ContentType);
        }

        import.Note = dto.Note ?? import.Note;
        import.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteImportAsync(Guid id, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var import = await _context.ImportReceipts
                .Include(i => i.ImportDetails)
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (import == null) throw new ArgumentException("Không tìm thấy phiếu nhập.");

            foreach (var detail in import.ImportDetails)
            {
                var product = await _context.Products.FindAsync(new object[] { detail.ProductId }, ct);
                if (product != null)
                {
                    product.Quantity -= detail.Quantity;
                    if (product.Quantity < 0)
                        throw new InvalidOperationException($"Không thể xóa phiếu nhập vì làm tồn kho sản phẩm '{product.ProductName}' âm.");
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.ImportReceipts.Remove(import);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IEnumerable<ImportMonthlyStatsDto>> GetMonthlyStatsAsync(int months = 12, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var startDate = new DateTime(now.AddMonths(-months + 1).Year,
                                     now.AddMonths(-months + 1).Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var imports = await _context.ImportReceipts
            .Include(i => i.ImportDetails)
            .Where(i => i.ImportDate >= startDate)
            .ToListAsync(ct);

        var result = new List<ImportMonthlyStatsDto>();
        for (int i = months - 1; i >= 0; i--)
        {
            var rawDate = DateTime.UtcNow.AddMonths(-i);
            var date = new DateTime(rawDate.Year, rawDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthImports = imports.Where(x => x.ImportDate.Year == date.Year && x.ImportDate.Month == date.Month).ToList();
            result.Add(new ImportMonthlyStatsDto(
                date.Year,
                date.Month,
                monthImports.Count,
                monthImports.Sum(x => x.ImportDetails.Sum(d => d.Quantity * d.Price)),
                monthImports.Sum(x => x.ImportDetails.Sum(d => d.Quantity))
            ));
        }

        return result;
    }

    private async Task<ImportReceiptDto> MapToDtoAsync(ImportReceipt i)
    {
        string? invoiceUrl = null;
        if (!string.IsNullOrEmpty(i.InvoiceFile))
            invoiceUrl = await _storageService.GetFileUrlAsync(i.InvoiceFile);

        var totalAmount = i.ImportDetails.Sum(d => d.Quantity * d.Price);

        return new ImportReceiptDto(
            i.Id,
            i.ReceiptCode,
            i.WarehouseId,
            i.Warehouse?.WarehouseName,
            i.CreatedBy,
            i.Creator?.FullName,
            i.ImportDate,
            invoiceUrl ?? i.InvoiceFile,
            i.Note,
            i.Status,
            GetStatusLabel(i.Status),
            totalAmount,
            i.ImportDetails.Select(d => new ImportDetailDto(
                d.Id,
                d.ProductId,
                d.Product?.ProductName,
                d.Product?.Unit,
                d.Quantity,
                d.Price,
                d.Quantity * d.Price,
                d.IndividualEquipments.Select(e => new IndividualEquipmentSummaryDto(
                    e.Id,
                    e.SerialNumber,
                    e.MacAddress,
                    e.Status,
                    GetStatusLabel(e.Status),
                    e.WarrantyExpiry,
                    e.WarrantyExpiry > DateTime.UtcNow
                )).ToList()
            )).ToList()
        );
    }

    private static string GetStatusLabel(EquipmentStatus status) => status switch
    {
        EquipmentStatus.InStock => "Trong kho",
        EquipmentStatus.Active => "Đang hoạt động",
        EquipmentStatus.Repairing => "Đang sửa chữa",
        EquipmentStatus.Retired => "Đã thanh lý",
        EquipmentStatus.Faulty => "Bị lỗi/hỏng",
        _ => "Không xác định"
    };

    private static string GetStatusLabel(ReceiptStatus status) => status switch
    {
        ReceiptStatus.Pending => "Chờ xử lý",
        ReceiptStatus.Completed => "Hoàn thành",
        ReceiptStatus.Cancelled => "Đã hủy",
        _ => "Không xác định"
    };
}
