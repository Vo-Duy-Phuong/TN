using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Dashboard;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default);
}

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var totalProducts = await _context.Products.CountAsync(ct);
        var totalCategories = await _context.Categories.CountAsync(ct);
        var totalWarehouses = await _context.Warehouses.CountAsync(ct);
        var totalUsers = await _context.Users.CountAsync(ct);
        
        var pendingRepairs = await _context.Repairs
            .CountAsync(r => r.Status == RepairStatus.Pending || r.Status == RepairStatus.Repairing, ct);

        var today = DateTime.UtcNow.Date;
        var recentImportsCount = await _context.ImportReceipts.CountAsync(i => i.ImportDate >= today, ct);
        var recentExportsCount = await _context.ExportReceipts.CountAsync(e => e.ExportDate >= today, ct);

        // Get recent activities (last 10 combined)
        var recentImports = await _context.ImportReceipts
            .Include(i => i.Warehouse)
            .OrderByDescending(i => i.ImportDate)
            .Take(5)
            .Select(i => new RecentActivityDto(
                "Nhập kho",
                $"Nhập hàng vào kho {i.Warehouse.WarehouseName}",
                i.ImportDate,
                "Import"
            ))
            .ToListAsync(ct);

        var recentExports = await _context.ExportReceipts
            .Include(e => e.Warehouse)
            .OrderByDescending(e => e.ExportDate)
            .Take(5)
            .Select(e => new RecentActivityDto(
                "Xuất kho",
                $"Xuất hàng từ kho {e.Warehouse.WarehouseName}",
                e.ExportDate,
                "Export"
            ))
            .ToListAsync(ct);

        var activities = recentImports.Concat(recentExports)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToList();

        return new DashboardStatsDto(
            totalProducts,
            totalCategories,
            totalWarehouses,
            totalUsers,
            pendingRepairs,
            recentImportsCount,
            recentExportsCount,
            activities
        );
    }
}
