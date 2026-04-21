using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Import;
using QLK.Application.DTOs.Product;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IIndividualEquipmentService
{
    Task<EquipmentPublicLookupDto?> LookupBySerialOrMacAsync(string query, CancellationToken ct = default);
    Task<IEnumerable<IndividualEquipmentSummaryDto>> GetByProductAsync(Guid productId, Guid? warehouseId = null, EquipmentStatus? status = null, CancellationToken ct = default);
}

public class IndividualEquipmentService : IIndividualEquipmentService
{
    private readonly ApplicationDbContext _context;

    public IndividualEquipmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EquipmentPublicLookupDto?> LookupBySerialOrMacAsync(string query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query)) return null;

        var search = query.Trim().ToLower();

        var equipment = await _context.Set<IndividualEquipment>()
            .Include(e => e.Product)
                .ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(e => 
                e.SerialNumber.ToLower() == search || 
                e.MacAddress.ToLower() == search, ct);

        if (equipment == null) return null;

        return new EquipmentPublicLookupDto(
            equipment.SerialNumber,
            equipment.MacAddress,
            equipment.Product.ProductName,
            equipment.Product.Category?.CategoryName,
            GetStatusLabel(equipment.Status),
            equipment.Status == EquipmentStatus.Active,
            equipment.WarrantyExpiry,
            equipment.WarrantyExpiry > DateTime.UtcNow,
            equipment.Product.EManualUrl,
            equipment.InstallationDate
        );
    }

    public async Task<IEnumerable<IndividualEquipmentSummaryDto>> GetByProductAsync(Guid productId, Guid? warehouseId = null, EquipmentStatus? status = null, CancellationToken ct = default)
    {
        var query = _context.Set<IndividualEquipment>()
            .Where(e => e.ProductId == productId)
            .AsQueryable();

        if (warehouseId.HasValue)
        {
            // Fallback: Show items in the specific warehouse OR items with no warehouse assigned (legacy data)
            query = query.Where(e => e.WarehouseId == warehouseId.Value || e.WarehouseId == null);
        }

        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        var equipments = await query
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);

        return equipments.Select(e => new IndividualEquipmentSummaryDto(
            e.Id,
            e.SerialNumber,
            e.MacAddress,
            e.Status,
            GetStatusLabel(e.Status),
            e.WarrantyExpiry,
            e.WarrantyExpiry > DateTime.UtcNow
        ));
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
