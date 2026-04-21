using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Export;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Domain.Interfaces;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IExportService
{
    Task<(IEnumerable<ExportReceiptDto> Items, int TotalCount)> GetExportsAsync(ExportFilterDto filter, CancellationToken ct = default);
    Task<ExportReceiptDto?> GetExportByIdAsync(Guid id, CancellationToken ct = default);
    Task<ExportReceiptDto> CreateExportAsync(CreateExportReceiptDto dto, Guid currentUserId, CancellationToken ct = default);
    Task UpdateExportAsync(Guid id, UpdateExportReceiptDto dto, CancellationToken ct = default);
    Task DeleteExportAsync(Guid id, CancellationToken ct = default);
}

public class ExportService : IExportService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public ExportService(ApplicationDbContext context, IStorageService storageService, INotificationService notificationService)
    {
        _context = context;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    public async Task<(IEnumerable<ExportReceiptDto> Items, int TotalCount)> GetExportsAsync(ExportFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.ExportReceipts
            .Include(e => e.Warehouse)
            .Include(e => e.Technician)
            .Include(e => e.ExportDetails)
                .ThenInclude(d => d.Product)
            .Include(e => e.ExportDetails)
                .ThenInclude(d => d.IndividualEquipments)
            .AsQueryable();

        if (filter.WarehouseId.HasValue)
            query = query.Where(e => e.WarehouseId == filter.WarehouseId.Value);

        if (filter.TechnicianId.HasValue)
            query = query.Where(e => e.TechnicianId == filter.TechnicianId.Value);

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(e => e.ReceiptCode.ToLower().Contains(s)
                || (e.Note != null && e.Note.ToLower().Contains(s)));
        }

        if (filter.Status.HasValue)
            query = query.Where(e => e.Status == filter.Status.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(e => e.ExportDate >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(e => e.ExportDate <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var exports = await query
            .OrderByDescending(e => e.ExportDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<ExportReceiptDto>();
        foreach (var e in exports)
            dtos.Add(await MapToDtoAsync(e));

        return (dtos, totalCount);
    }

    public async Task<ExportReceiptDto?> GetExportByIdAsync(Guid id, CancellationToken ct = default)
    {
        var export = await _context.ExportReceipts
            .Include(e => e.Warehouse)
            .Include(e => e.Technician)
            .Include(e => e.ExportDetails)
                .ThenInclude(d => d.Product)
            .Include(e => e.ExportDetails)
                .ThenInclude(d => d.IndividualEquipments)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        return export == null ? null : await MapToDtoAsync(export);
    }

    public async Task<ExportReceiptDto> CreateExportAsync(CreateExportReceiptDto dto, Guid currentUserId, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            // Generate receipt code: PX-YYYYMMDD-XXX
            var today = DateTime.UtcNow;
            var prefix = $"PX-{today:yyyyMMdd}-";
            var countToday = await _context.ExportReceipts
                .CountAsync(e => e.ExportDate.Date == today.Date, ct);
            var receiptCode = $"{prefix}{(countToday + 1):D3}";

            // Upload export file if provided
            string? exportFilePath = null;
            if (dto.ExportFileUpload != null)
            {
                using var stream = dto.ExportFileUpload.OpenReadStream();
                exportFilePath = await _storageService.UploadFileAsync(
                    stream, dto.ExportFileUpload.FileName, dto.ExportFileUpload.ContentType);
            }

            var export = new ExportReceipt
            {
                Id = Guid.NewGuid(),
                ReceiptCode = receiptCode,
                WarehouseId = dto.WarehouseId,
                TechnicianId = dto.TechnicianId,
                ExportDate = DateTime.UtcNow,
                ExportFile = exportFilePath,
                Note = dto.Note,
                Status = ReceiptStatus.Completed
            };

            await _context.ExportReceipts.AddAsync(export, ct);

            foreach (var detailDto in dto.Details)
            {
                var product = await _context.Products.FindAsync(new object[] { detailDto.ProductId }, ct);
                if (product == null) throw new ArgumentException($"Sản phẩm ID {detailDto.ProductId} không tồn tại.");

                if (product.Quantity < detailDto.Quantity)
                    throw new InvalidOperationException($"Sản phẩm '{product.ProductName}' không đủ tồn kho (Hiện có: {product.Quantity}, Yêu cầu: {detailDto.Quantity}).");

                var detail = new ExportDetail
                {
                    Id = Guid.NewGuid(),
                    ExportId = export.Id,
                    ProductId = detailDto.ProductId,
                    Quantity = detailDto.Quantity
                };
                await _context.ExportDetails.AddAsync(detail, ct);

                // Track individual equipment if serials provided
                if (detailDto.SerialNumbers != null && detailDto.SerialNumbers.Any())
                {
                    foreach (var serial in detailDto.SerialNumbers)
                    {
                        var equipment = await _context.Set<IndividualEquipment>()
                            .FirstOrDefaultAsync(e => e.ProductId == product.Id && e.SerialNumber == serial && e.Status == EquipmentStatus.InStock, ct);
                        
                        if (equipment == null)
                            throw new InvalidOperationException($"Thiết bị Serial '{serial}' không có sẵn trong kho.");

                        equipment.Status = EquipmentStatus.Active;
                        equipment.WarehouseId = null;
                        equipment.ExportDetailId = detail.Id;
                        equipment.InstallationDate = DateTime.UtcNow;
                        equipment.UpdatedAt = DateTime.UtcNow;
                    }
                }

                product.Quantity -= detailDto.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                var log = new InventoryLog
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ActionType = InventoryActionType.Export,
                    Quantity = -detailDto.Quantity,
                    UserId = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.InventoryLogs.AddAsync(log, ct);
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            var created = (await GetExportByIdAsync(export.Id, ct))!;

            // Gửi notification cho admin/manager và kỹ thuật viên
            var notifyUserIds = await _context.Users
                .Where(u => u.Role.Code == "ADMIN" || u.Role.Code == "WAREHOUSE_MANAGER")
                .Select(u => u.Id)
                .ToListAsync(ct);

            if (dto.TechnicianId != currentUserId && !notifyUserIds.Contains(dto.TechnicianId))
            {
                notifyUserIds.Add(dto.TechnicianId);
            }

            foreach (var userId in notifyUserIds)
            {
                await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto(
                    userId,
                    "Phiếu xuất kho mới",
                    $"Phiếu xuất {receiptCode} đã được tạo với {dto.Details.Count} mặt hàng.",
                    Domain.Enums.NotificationType.System,
                    $"/exports/{export.Id}",
                    export.Id,
                    "ExportReceipt"
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

    public async Task UpdateExportAsync(Guid id, UpdateExportReceiptDto dto, CancellationToken ct = default)
    {
        var export = await _context.ExportReceipts.FindAsync(new object[] { id }, ct);
        if (export == null) throw new ArgumentException("Không tìm thấy phiếu xuất.");

        if (dto.ExportFileUpload != null)
        {
            using var stream = dto.ExportFileUpload.OpenReadStream();
            export.ExportFile = await _storageService.UploadFileAsync(
                stream, dto.ExportFileUpload.FileName, dto.ExportFileUpload.ContentType);
        }

        export.Note = dto.Note ?? export.Note;
        export.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteExportAsync(Guid id, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var export = await _context.ExportReceipts
                .Include(e => e.ExportDetails)
                .FirstOrDefaultAsync(e => e.Id == id, ct);

            if (export == null) throw new ArgumentException("Không tìm thấy phiếu xuất.");

            foreach (var detail in export.ExportDetails)
            {
                var product = await _context.Products.FindAsync(new object[] { detail.ProductId }, ct);
                if (product != null)
                {
                    product.Quantity += detail.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.ExportReceipts.Remove(export);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private async Task<ExportReceiptDto> MapToDtoAsync(ExportReceipt e)
    {
        string? exportUrl = null;
        if (!string.IsNullOrEmpty(e.ExportFile))
            exportUrl = await _storageService.GetFileUrlAsync(e.ExportFile);

        return new ExportReceiptDto(
            e.Id,
            e.ReceiptCode,
            e.WarehouseId,
            e.Warehouse?.WarehouseName,
            e.TechnicianId,
            e.Technician?.FullName,
            e.ExportDate,
            exportUrl ?? e.ExportFile,
            e.Note,
            e.Status,
            GetStatusLabel(e.Status),
            e.ExportDetails.Select(d => new ExportDetailDto(
                d.Id,
                d.ProductId,
                d.Product?.ProductName,
                d.Product?.Unit,
                d.Quantity,
                d.IndividualEquipments.Select(ie => new QLK.Application.DTOs.Import.IndividualEquipmentSummaryDto(
                    ie.Id,
                    ie.SerialNumber,
                    ie.MacAddress,
                    ie.Status,
                    GetStatusLabel(ie.Status),
                    ie.WarrantyExpiry,
                    ie.WarrantyExpiry > DateTime.UtcNow
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
