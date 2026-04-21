using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Dashboard;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default);
    Task<IEnumerable<MonthlyImportExportDto>> GetMonthlyStatsAsync(int months = 12, CancellationToken ct = default);
    Task<IEnumerable<LowStockAlertDto>> GetLowStockAlertsAsync(CancellationToken ct = default);
    Task<IEnumerable<InventoryValueByCategory>> GetInventoryValueByCategoryAsync(CancellationToken ct = default);
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
        var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted, ct);
        var totalCategories = await _context.Categories.CountAsync(ct);
        var totalWarehouses = await _context.Warehouses.CountAsync(ct);
        var totalUsers = await _context.Users.CountAsync(ct);

        var repairCounts = await _context.Repairs
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var pendingRepairs = repairCounts
            .Where(r => r.Status == RepairStatus.Pending || r.Status == RepairStatus.Repairing)
            .Sum(r => r.Count);

        var repairStats = new RepairStatsDto(
            repairCounts.FirstOrDefault(r => r.Status == RepairStatus.Pending)?.Count ?? 0,
            repairCounts.FirstOrDefault(r => r.Status == RepairStatus.Repairing)?.Count ?? 0,
            repairCounts.FirstOrDefault(r => r.Status == RepairStatus.Completed)?.Count ?? 0,
            repairCounts.FirstOrDefault(r => r.Status == RepairStatus.Unrepairable)?.Count ?? 0
        );

        // PostgreSQL fix: Ensure UTC for date comparisons
        var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var tomorrow = DateTime.SpecifyKind(today.AddDays(1), DateTimeKind.Utc);
        
        var todayImportsCount = await _context.ImportReceipts.CountAsync(i => i.ImportDate >= today && i.ImportDate < tomorrow, ct);
        var todayExportsCount = await _context.ExportReceipts.CountAsync(e => e.ExportDate >= today && e.ExportDate < tomorrow, ct);

        // Tổng giá trị tồn kho
        var totalInventoryValue = await _context.Products
            .Where(p => !p.IsDeleted)
            .SumAsync(p => (decimal)p.Quantity * p.Price, ct);

        // Số sản phẩm tồn thấp
        var lowStockCount = await _context.Products
            .CountAsync(p => !p.IsDeleted && p.MinQuantity > 0 && p.Quantity <= p.MinQuantity, ct);

        // Hoạt động gần đây - Fetch raw data first to avoid translation errors
        var importsRaw = await _context.ImportReceipts
            .Include(i => i.Warehouse)
            .Include(i => i.Creator)
            .OrderByDescending(i => i.ImportDate)
            .Take(5)
            .ToListAsync(ct);

        var recentImports = importsRaw.Select(i => new RecentActivityDto(
            "Nhập kho",
            $"[{i.ReceiptCode}] {(i.Creator != null ? i.Creator.FullName : "Hệ thống")} nhập hàng vào kho {(i.Warehouse != null ? i.Warehouse.WarehouseName : "N/A")}",
            i.ImportDate,
            "Import"
        )).ToList();

        var exportsRaw = await _context.ExportReceipts
            .Include(e => e.Warehouse)
            .Include(e => e.Technician)
            .OrderByDescending(e => e.ExportDate)
            .Take(5)
            .ToListAsync(ct);

        var recentExports = exportsRaw.Select(e => new RecentActivityDto(
            "Xuất kho",
            $"[{e.ReceiptCode}] {(e.Technician != null ? e.Technician.FullName : "N/A")} nhận hàng từ kho {(e.Warehouse != null ? e.Warehouse.WarehouseName : "N/A")}",
            e.ExportDate,
            "Export"
        )).ToList();

        var repairsRaw = await _context.Repairs
            .Include(r => r.Product)
            .Include(r => r.Technician)
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(3)
            .ToListAsync(ct);

        var recentRepairs = repairsRaw.Select(r => new RecentActivityDto(
            "Sửa chữa",
            $"{(r.Technician != null ? r.Technician.FullName : "Kỹ thuật viên")} cập nhật sửa chữa: {(r.Product != null ? r.Product.ProductName : "Thiết bị")}",
            r.UpdatedAt ?? r.CreatedAt,
            "Repair"
        )).ToList();

        var activities = recentImports
            .Concat(recentExports)
            .Concat(recentRepairs)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToList();

        // Thống kê theo danh mục - Safe grouping
        var productsList = await _context.Products
            .Where(p => !p.IsDeleted)
            .Include(p => p.Category)
            .Select(p => new { 
                CategoryName = p.Category != null ? p.Category.CategoryName : "Chưa phân loại",
                Value = (decimal)p.Quantity * p.Price
            })
            .ToListAsync(ct);

        var categoryStats = productsList
            .GroupBy(x => x.CategoryName)
            .Select(g => new CategoryDistributionDto(
                g.Key,
                g.Count(),
                g.Sum(x => x.Value)
            ))
            .OrderByDescending(x => x.Count)
            .ToList();

        // Dự báo rủi ro tồn kho (AI)
        var thirtyDaysAgo = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-30), DateTimeKind.Utc);
        
        // Fix N+1: single GROUP BY query for all products' 30-day usage
        var activeProducts = await _context.Products
            .Where(p => !p.IsDeleted && p.Quantity > 0)
            .Select(p => new { p.Id, p.ProductName, p.Quantity })
            .ToListAsync(ct);

        var activeProductIds = activeProducts.Select(p => p.Id).ToList();

        var usageByProduct = await _context.ExportDetails
            .Where(ed => activeProductIds.Contains(ed.ProductId)
                      && ed.ExportReceipt.ExportDate >= thirtyDaysAgo)
            .GroupBy(ed => ed.ProductId)
            .Select(g => new { ProductId = g.Key, TotalUsage = g.Sum(ed => ed.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.TotalUsage, ct);

        var riskForecasts = new List<StockForecastDto>();
        foreach (var p in activeProducts)
        {
            var usage = usageByProduct.GetValueOrDefault(p.Id, 0);
            if (usage > 0)
            {
                var rate = (double)usage / 30.0;
                riskForecasts.Add(new StockForecastDto(
                    p.Id,
                    p.ProductName,
                    p.Quantity,
                    (int)Math.Min(1000, Math.Floor(p.Quantity / rate)),
                    Math.Round(rate, 2)
                ));
            }
        }

        riskForecasts = riskForecasts
            .OrderBy(x => x.DaysRemaining)
            .Take(5)
            .ToList();

        return new DashboardStatsDto(
            totalProducts,
            totalCategories,
            totalWarehouses,
            totalUsers,
            pendingRepairs,
            todayImportsCount,
            todayExportsCount,
            totalInventoryValue,
            lowStockCount,
            repairStats,
            activities,
            categoryStats,
            riskForecasts
        );
    }

    public async Task<IEnumerable<MonthlyImportExportDto>> GetMonthlyStatsAsync(int months = 12, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var startDate = new DateTime(now.AddMonths(-months + 1).Year,
                                     now.AddMonths(-months + 1).Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var imports = await _context.ImportReceipts
            .Include(i => i.ImportDetails)
            .Where(i => i.ImportDate >= startDate)
            .ToListAsync(ct);

        var exports = await _context.ExportReceipts
            .Where(e => e.ExportDate >= startDate)
            .ToListAsync(ct);

        var monthNames = new[] { "", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                                  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12" };

        var result = new List<MonthlyImportExportDto>();
        for (int i = months - 1; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            date = new DateTime(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var year = date.Year;
            var month = date.Month;

            var monthImports = imports.Where(x => x.ImportDate.Year == year && x.ImportDate.Month == month).ToList();
            var monthExports = exports.Where(x => x.ExportDate.Year == year && x.ExportDate.Month == month).ToList();

            result.Add(new MonthlyImportExportDto(
                year,
                month,
                $"{monthNames[month]}/{year}",
                monthImports.Count,
                monthImports.Sum(x => x.ImportDetails.Sum(d => d.Quantity * d.Price)),
                monthExports.Count
            ));
        }

        return result;
    }

    public async Task<IEnumerable<LowStockAlertDto>> GetLowStockAlertsAsync(CancellationToken ct = default)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => !p.IsDeleted && p.MinQuantity > 0 && p.Quantity <= p.MinQuantity)
            .OrderBy(p => p.Quantity)
            .ToListAsync(ct);

        return products.Select(p => new LowStockAlertDto(
            p.Id,
            p.ProductName,
            p.Category?.CategoryName,
            p.Quantity,
            p.MinQuantity,
            p.Unit
        ));
    }

    public async Task<IEnumerable<InventoryValueByCategory>> GetInventoryValueByCategoryAsync(CancellationToken ct = default)
    {
        var result = await _context.Products
            .Where(p => !p.IsDeleted)
            .GroupBy(p => p.Category.CategoryName)
            .Select(g => new InventoryValueByCategory(
                g.Key ?? "Chưa phân loại",
                g.Count(),
                g.Sum(p => (decimal)p.Quantity * p.Price)
            ))
            .OrderByDescending(x => x.TotalValue)
            .ToListAsync(ct);

        return result;
    }
}
