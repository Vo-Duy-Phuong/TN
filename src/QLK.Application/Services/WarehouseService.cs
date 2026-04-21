using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Warehouse;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IWarehouseService
{
    Task<(IEnumerable<WarehouseDto> Items, int TotalCount)> GetWarehousesAsync(WarehouseFilterDto filter, CancellationToken ct = default);
    Task<WarehouseDto?> GetWarehouseByIdAsync(Guid id, CancellationToken ct = default);
    Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseDto dto, CancellationToken ct = default);
    Task UpdateWarehouseAsync(Guid id, UpdateWarehouseDto dto, CancellationToken ct = default);
    Task DeleteWarehouseAsync(Guid id, CancellationToken ct = default);
}

public class WarehouseService : IWarehouseService
{
    private readonly ApplicationDbContext _context;

    public WarehouseService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<WarehouseDto> Items, int TotalCount)> GetWarehousesAsync(WarehouseFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Warehouses
            .Include(w => w.Manager)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(w => w.WarehouseName.ToLower().Contains(search) || 
                                    (w.Location != null && w.Location.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(ct);
        var warehouses = await query
            .OrderBy(w => w.WarehouseName)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (warehouses.Select(MapToDto), totalCount);
    }

    public async Task<WarehouseDto?> GetWarehouseByIdAsync(Guid id, CancellationToken ct = default)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.Manager)
            .FirstOrDefaultAsync(w => w.Id == id, ct);
        return warehouse == null ? null : MapToDto(warehouse);
    }

    public async Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseDto dto, CancellationToken ct = default)
    {
        var manager = await _context.Users.FindAsync(new object[] { dto.ManagerId }, ct);
        if (manager == null) throw new ArgumentException("Người quản lý không hợp lệ.");

        var warehouse = new Warehouse
        {
            Id = Guid.NewGuid(),
            WarehouseName = dto.WarehouseName,
            Location = dto.Location,
            ManagerId = dto.ManagerId
        };

        await _context.Warehouses.AddAsync(warehouse, ct);
        await _context.SaveChangesAsync(ct);

        return MapToDto(warehouse);
    }

    public async Task UpdateWarehouseAsync(Guid id, UpdateWarehouseDto dto, CancellationToken ct = default)
    {
        var warehouse = await _context.Warehouses.FindAsync(new object[] { id }, ct);
        if (warehouse == null) throw new ArgumentException("Không tìm thấy kho.");

        var manager = await _context.Users.FindAsync(new object[] { dto.ManagerId }, ct);
        if (manager == null) throw new ArgumentException("Người quản lý không hợp lệ.");

        warehouse.WarehouseName = dto.WarehouseName;
        warehouse.Location = dto.Location;
        warehouse.ManagerId = dto.ManagerId;

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteWarehouseAsync(Guid id, CancellationToken ct = default)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.ImportReceipts)
            .Include(w => w.ExportReceipts)
            .FirstOrDefaultAsync(w => w.Id == id, ct);

        if (warehouse == null) throw new ArgumentException("Không tìm thấy kho.");

        if (warehouse.ImportReceipts.Any() || warehouse.ExportReceipts.Any())
            throw new InvalidOperationException("Không thể xóa kho đã có dữ liệu phiếu nhập/xuất.");

        _context.Warehouses.Remove(warehouse);
        await _context.SaveChangesAsync(ct);
    }

    private static WarehouseDto MapToDto(Warehouse w) => new WarehouseDto(
        w.Id,
        w.WarehouseName,
        w.Location,
        w.ManagerId,
        w.Manager?.FullName
    );
}
