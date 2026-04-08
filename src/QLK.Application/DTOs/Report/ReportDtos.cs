namespace QLK.Application.DTOs.Report;

public record ReportDto(
    Guid Id,
    string ReportName,
    string? ReportFile,
    Guid CreatedBy,
    string? CreatorFullName,
    DateTime CreatedAt
);

public record CreateReportDto(
    string ReportName,
    string? ReportFile,
    Guid CreatedBy
);

public record ReportFilterDto(
    string? Search,
    Guid? CreatedBy,
    int PageNumber = 1,
    int PageSize = 10
);
