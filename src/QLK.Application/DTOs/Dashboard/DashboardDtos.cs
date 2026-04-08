namespace QLK.Application.DTOs.Dashboard;

public record DashboardStatsDto(
    int TotalProducts,
    int TotalCategories,
    int TotalWarehouses,
    int TotalUsers,
    int PendingRepairs,
    int RecentImportsCount,
    int RecentExportsCount,
    List<RecentActivityDto> RecentActivities
);

public record RecentActivityDto(
    string Title,
    string Message,
    DateTime CreatedAt,
    string Type // Import, Export, Repair, etc.
);
