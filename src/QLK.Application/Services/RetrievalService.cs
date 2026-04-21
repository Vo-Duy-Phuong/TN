using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Retrieval;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IRetrievalService
{
    Task<(IEnumerable<RetrievalReceiptDto> Items, int TotalCount)> GetRetrievalsAsync(RetrievalFilterDto filter, CancellationToken ct = default);
    Task<RetrievalReceiptDto?> GetRetrievalByIdAsync(Guid id, CancellationToken ct = default);
    Task<RetrievalReceiptDto> CreateRetrievalAsync(CreateRetrievalDto dto, Guid userId, CancellationToken ct = default);
    Task DeleteRetrievalAsync(Guid id, CancellationToken ct = default);
}

public class RetrievalFilterDto
{
    public Guid? WarehouseId { get; set; }
    public Guid? TechnicianId { get; set; }
    public string? Search { get; set; }
    public ReceiptStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class RetrievalService : IRetrievalService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public RetrievalService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<(IEnumerable<RetrievalReceiptDto> Items, int TotalCount)> GetRetrievalsAsync(RetrievalFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.RetrievalReceipts
            .Include(r => r.Warehouse)
            .Include(r => r.Technician)
            .Include(r => r.RetrievalDetails)
                .ThenInclude(d => d.Product)
            .Include(r => r.RetrievalDetails)
                .ThenInclude(d => d.IndividualEquipments)
            .AsQueryable();

        if (filter.WarehouseId.HasValue)
            query = query.Where(r => r.WarehouseId == filter.WarehouseId.Value);

        if (filter.TechnicianId.HasValue)
            query = query.Where(r => r.TechnicianId == filter.TechnicianId.Value);

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(r => r.ReceiptCode.ToLower().Contains(s)
                || (r.Note != null && r.Note.ToLower().Contains(s)));
        }

        if (filter.Status.HasValue)
            query = query.Where(r => r.Status == filter.Status.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(r => r.RetrievalDate >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(r => r.RetrievalDate <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var retrievals = await query
            .OrderByDescending(r => r.RetrievalDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = retrievals.Select(r => MapToDto(r)).ToList();
        return (dtos, totalCount);
    }

    public async Task<RetrievalReceiptDto?> GetRetrievalByIdAsync(Guid id, CancellationToken ct = default)
    {
        var retrieval = await _context.RetrievalReceipts
            .Include(r => r.Warehouse)
            .Include(r => r.Technician)
            .Include(r => r.RetrievalDetails)
                .ThenInclude(d => d.Product)
            .Include(r => r.RetrievalDetails)
                .ThenInclude(d => d.IndividualEquipments)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        return retrieval == null ? null : MapToDto(retrieval);
    }

    public async Task<RetrievalReceiptDto> CreateRetrievalAsync(CreateRetrievalDto dto, Guid userId, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            // Generate receipt code: TH-YYYYMMDD-XXX
            var today = DateTime.UtcNow;
            var prefix = $"TH-{today:yyyyMMdd}-";
            var countToday = await _context.RetrievalReceipts
                .CountAsync(r => r.RetrievalDate.Date == today.Date, ct);
            var receiptCode = $"{prefix}{(countToday + 1):D3}";

            var retrieval = new RetrievalReceipt
            {
                Id = Guid.NewGuid(),
                ReceiptCode = receiptCode,
                WarehouseId = dto.WarehouseId,
                TechnicianId = dto.TechnicianId,
                RetrievalDate = DateTime.UtcNow,
                Note = dto.Note,
                Status = ReceiptStatus.Completed
            };

            await _context.RetrievalReceipts.AddAsync(retrieval, ct);

            foreach (var detailDto in dto.Details)
            {
                var product = await _context.Products.FindAsync(new object[] { detailDto.ProductId }, ct);
                if (product == null) throw new ArgumentException($"Sản phẩm ID {detailDto.ProductId} không tồn tại.");

                var detail = new RetrievalDetail
                {
                    Id = Guid.NewGuid(),
                    RetrievalReceiptId = retrieval.Id,
                    ProductId = detailDto.ProductId,
                    Quantity = detailDto.Quantity,
                    Condition = detailDto.Condition
                };
                await _context.RetrievalDetails.AddAsync(detail, ct);

                // Track individual equipment if serials provided
                if (detailDto.SerialNumbers != null && detailDto.SerialNumbers.Any())
                {
                    foreach (var serial in detailDto.SerialNumbers)
                    {
                        var equipment = await _context.Set<IndividualEquipment>()
                            .FirstOrDefaultAsync(e => e.ProductId == product.Id && e.SerialNumber == serial, ct);

                        if (equipment == null)
                            throw new InvalidOperationException($"Thiết bị Serial '{serial}' không tồn tại trong hệ thống.");

                        if (equipment.Status != EquipmentStatus.Active)
                            throw new InvalidOperationException($"Thiết bị Serial '{serial}' hiện đang có trạng thái '{GetStatusLabel(equipment.Status)}'. Chỉ có thể thu hồi thiết bị đang ở trạng thái 'Đang hoạt động'.");

                        equipment.Status = detailDto.Condition == "Tốt" ? EquipmentStatus.InStock : EquipmentStatus.Faulty;
                        equipment.WarehouseId = retrieval.WarehouseId;
                        equipment.RetrievalDetailId = detail.Id;
                        equipment.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Update stock based on condition
                if (detailDto.Condition == "Tốt")
                {
                    product.Quantity += detailDto.Quantity;
                }
                else
                {
                    product.FaultyQuantity += detailDto.Quantity;
                }
                product.UpdatedAt = DateTime.UtcNow;

                // Log inventory
                var log = new InventoryLog
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ActionType = InventoryActionType.Retrieval,
                    Quantity = detailDto.Quantity,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.InventoryLogs.AddAsync(log, ct);
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            // Reload data
            var created = (await GetRetrievalByIdAsync(retrieval.Id, ct))!;

            // Notifications
            var admins = await _context.Users
                .Where(u => u.Role.Code == "ADMIN" || u.Role.Code == "WAREHOUSE_MANAGER")
                .Select(u => u.Id)
                .ToListAsync(ct);

            foreach (var adminId in admins)
            {
                await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto(
                    adminId,
                    "Phiếu thu hồi thiết bị mới",
                    $"Phiếu thu hồi {receiptCode} vừa được tạo bởi {created.TechnicianName}.",
                    NotificationType.System,
                    $"/retrievals/{retrieval.Id}",
                    retrieval.Id,
                    "RetrievalReceipt"
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

    public async Task DeleteRetrievalAsync(Guid id, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var retrieval = await _context.RetrievalReceipts
                .Include(r => r.RetrievalDetails)
                .FirstOrDefaultAsync(r => r.Id == id, ct);

            if (retrieval == null) throw new ArgumentException("Không tìm thấy phiếu thu hồi.");

            foreach (var detail in retrieval.RetrievalDetails)
            {
                var product = await _context.Products.FindAsync(new object[] { detail.ProductId }, ct);
                if (product != null)
                {
                    if (detail.Condition == "Tốt")
                    {
                        product.Quantity -= detail.Quantity;
                        if (product.Quantity < 0)
                            throw new InvalidOperationException($"Không thể xóa phiếu thu hồi vì làm tồn kho sản phẩm '{product.ProductName}' âm.");
                    }
                    else
                    {
                        product.FaultyQuantity -= detail.Quantity;
                        if (product.FaultyQuantity < 0)
                            throw new InvalidOperationException($"Không thể xóa phiếu thu hồi vì làm tồn kho lỗi của sản phẩm '{product.ProductName}' âm.");
                    }
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.RetrievalReceipts.Remove(retrieval);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private RetrievalReceiptDto MapToDto(RetrievalReceipt r)
    {
        return new RetrievalReceiptDto
        {
            Id = r.Id,
            ReceiptCode = r.ReceiptCode,
            WarehouseId = r.WarehouseId,
            WarehouseName = r.Warehouse?.WarehouseName ?? "N/A",
            TechnicianId = r.TechnicianId,
            TechnicianName = r.Technician?.FullName ?? "N/A",
            RetrievalDate = r.RetrievalDate,
            Note = r.Note,
            Status = r.Status,
            Details = r.RetrievalDetails.Select(d => new RetrievalDetailDto
            {
                Id = d.Id,
                ProductId = d.ProductId,
                ProductName = d.Product?.ProductName ?? "N/A",
                Unit = d.Product?.Unit ?? "cái",
                Quantity = d.Quantity,
                Condition = d.Condition,
                Equipments = d.IndividualEquipments.Select(ie => new QLK.Application.DTOs.Import.IndividualEquipmentSummaryDto(
                    ie.Id,
                    ie.SerialNumber,
                    ie.MacAddress,
                    ie.Status,
                    GetStatusLabel(ie.Status),
                    ie.WarrantyExpiry,
                    ie.WarrantyExpiry > DateTime.UtcNow
                )).ToList()
            }).ToList()
        };
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
}
