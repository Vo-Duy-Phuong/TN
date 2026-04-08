namespace QLK.Application.DTOs.Export;

public record ExportReceiptDto(
    Guid Id,
    Guid WarehouseId,
    string? WarehouseName,
    Guid TechnicianId,
    string? TechnicianFullName,
    DateTime ExportDate,
    string? ExportFile,
    string? Note,
    List<ExportDetailDto> Details
);

public record ExportDetailDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    int Quantity
);

public record CreateExportReceiptDto(
    Guid WarehouseId,
    Guid TechnicianId,
    string? ExportFile,
    string? Note,
    List<CreateExportDetailDto> Details
);

public record CreateExportDetailDto(
    Guid ProductId,
    int Quantity
);

public record ExportFilterDto(
    Guid? WarehouseId,
    Guid? TechnicianId,
    DateTime? StartDate,
    DateTime? EndDate,
    int PageNumber = 1,
    int PageSize = 10
);
