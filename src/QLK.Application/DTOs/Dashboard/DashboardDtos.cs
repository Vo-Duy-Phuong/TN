namespace QLK.Application.DTOs.Dashboard;

public record DashboardStatsDto(
    int TotalProducts,
    int TotalCategories,
    int TotalWarehouses,
    int TotalUsers,
    int PendingRepairs,
    int TodayImportsCount,
    int TodayExportsCount,
    decimal TotalInventoryValue,
    int LowStockCount,
    RepairStatsDto RepairStats,
    List<RecentActivityDto> RecentActivities,
    List<CategoryDistributionDto> CategoryStats,
    List<StockForecastDto> RiskForecasts
);

public record CategoryDistributionDto(
    string Name,
    int Count,
    decimal Value
);

public record StockForecastDto(
    Guid ProductId,
    string ProductName,
    int Quantity,
    int? DaysRemaining,
    double ConsumptionRate
);

public record RecentActivityDto(
    string Title,
    string Message,
    DateTime CreatedAt,
    string Type // Import, Export, Repair, etc.
);

public record MonthlyImportExportDto(
    int Year,
    int Month,
    string MonthLabel,
    int ImportCount,
    decimal ImportAmount,
    int ExportCount
);

public record RepairStatsDto(
    int Pending,
    int Repairing,
    int Completed,
    int Unrepairable
);

public record LowStockAlertDto(
    Guid ProductId,
    string ProductName,
    string? CategoryName,
    int Quantity,
    int MinQuantity,
    string Unit
);

public record InventoryValueByCategory(
    string CategoryName,
    int TotalProducts,
    decimal TotalValue
);
