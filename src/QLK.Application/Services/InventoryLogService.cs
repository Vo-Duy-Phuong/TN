using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Inventory;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IInventoryLogService
{
    Task<(IEnumerable<InventoryLogDto> Items, int TotalCount)> GetLogsAsync(InventoryLogFilterDto filter, CancellationToken ct = default);
    Task CreateLogAsync(InventoryLog log, CancellationToken ct = default);
}

public class InventoryLogService : IInventoryLogService
{
    private readonly ApplicationDbContext _context;

    public InventoryLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<InventoryLogDto> Items, int TotalCount)> GetLogsAsync(InventoryLogFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.InventoryLogs
            .Include(l => l.Product)
            .Include(l => l.User)
            .AsQueryable();

        if (filter.ProductId.HasValue)
            query = query.Where(l => l.ProductId == filter.ProductId.Value);

        if (filter.ActionType.HasValue)
            query = query.Where(l => l.ActionType == filter.ActionType.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(l => l.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(l => l.CreatedAt <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (logs.Select(MapToDto), totalCount);
    }

    public async Task CreateLogAsync(InventoryLog log, CancellationToken ct = default)
    {
        await _context.InventoryLogs.AddAsync(log, ct);
        await _context.SaveChangesAsync(ct);
    }

    private static InventoryLogDto MapToDto(InventoryLog l) => new InventoryLogDto(
        l.Id,
        l.ProductId,
        l.Product?.ProductName,
        l.ActionType,
        l.Quantity,
        l.UserId,
        l.User?.FullName,
        l.CreatedAt
    );
}
