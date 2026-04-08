using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Repair;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Domain.Interfaces;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IRepairService
{
    Task<(IEnumerable<RepairDto> Items, int TotalCount)> GetRepairsAsync(RepairFilterDto filter, CancellationToken ct = default);
    Task<RepairDto?> GetRepairByIdAsync(Guid id, CancellationToken ct = default);
    Task<RepairDto> CreateRepairAsync(CreateRepairDto dto, CancellationToken ct = default);
    Task UpdateRepairAsync(Guid id, UpdateRepairDto dto, CancellationToken ct = default);
    Task DeleteRepairAsync(Guid id, CancellationToken ct = default);
}

public class RepairService : IRepairService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public RepairService(ApplicationDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<(IEnumerable<RepairDto> Items, int TotalCount)> GetRepairsAsync(RepairFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Repairs
            .Include(r => r.Product)
            .Include(r => r.Technician)
            .AsQueryable();

        if (filter.ProductId.HasValue)
            query = query.Where(r => r.ProductId == filter.ProductId.Value);

        if (filter.TechnicianId.HasValue)
            query = query.Where(r => r.TechnicianId == filter.TechnicianId.Value);

        if (filter.Status.HasValue)
            query = query.Where(r => r.Status == filter.Status.Value);

        var totalCount = await query.CountAsync(ct);
        var repairs = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<RepairDto>();
        foreach (var repair in repairs)
        {
            dtos.Add(await MapToDtoAsync(repair));
        }

        return (dtos, totalCount);
    }

    public async Task<RepairDto?> GetRepairByIdAsync(Guid id, CancellationToken ct = default)
    {
        var repair = await _context.Repairs
            .Include(r => r.Product)
            .Include(r => r.Technician)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        return repair == null ? null : await MapToDtoAsync(repair);
    }

    public async Task<RepairDto> CreateRepairAsync(CreateRepairDto dto, CancellationToken ct = default)
    {
        var repair = new Repair
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            TechnicianId = dto.TechnicianId,
            Problem = dto.Problem,
            ImageBefore = dto.ImageBefore,
            Status = RepairStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Repairs.AddAsync(repair, ct);
        await _context.SaveChangesAsync(ct);

        return await MapToDtoAsync(repair);
    }

    public async Task UpdateRepairAsync(Guid id, UpdateRepairDto dto, CancellationToken ct = default)
    {
        var repair = await _context.Repairs.FindAsync(new object[] { id }, ct);
        if (repair == null) throw new ArgumentException("Không tìm thấy thông tin sửa chữa.");

        repair.Problem = dto.Problem;
        repair.ImageBefore = dto.ImageBefore;
        repair.ImageAfter = dto.ImageAfter;
        repair.Status = dto.Status;

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteRepairAsync(Guid id, CancellationToken ct = default)
    {
        var repair = await _context.Repairs.FindAsync(new object[] { id }, ct);
        if (repair == null) throw new ArgumentException("Không tìm thấy thông tin sửa chữa.");

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync(ct);
    }

    private async Task<RepairDto> MapToDtoAsync(Repair r)
    {
        var imageBeforeUrl = !string.IsNullOrEmpty(r.ImageBefore) 
            ? await _storageService.GetFileUrlAsync(r.ImageBefore) 
            : null;

        var imageAfterUrl = !string.IsNullOrEmpty(r.ImageAfter) 
            ? await _storageService.GetFileUrlAsync(r.ImageAfter) 
            : null;

        return new RepairDto(
            r.Id,
            r.ProductId,
            r.Product?.ProductName,
            r.TechnicianId,
            r.Technician?.FullName,
            r.Problem,
            imageBeforeUrl ?? r.ImageBefore,
            imageAfterUrl ?? r.ImageAfter,
            r.Status,
            r.CreatedAt
        );
    }
}
