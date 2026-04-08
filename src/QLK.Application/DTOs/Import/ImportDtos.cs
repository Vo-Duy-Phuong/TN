namespace QLK.Application.DTOs.Import;

public record ImportReceiptDto(
    Guid Id,
    Guid WarehouseId,
    string? WarehouseName,
    Guid CreatedBy,
    string? CreatorFullName,
    DateTime ImportDate,
    string? InvoiceFile,
    string? Note,
    List<ImportDetailDto> Details
);

public record ImportDetailDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    int Quantity,
    decimal Price
);

public record CreateImportReceiptDto(
    Guid WarehouseId,
    Guid CreatedBy,
    string? InvoiceFile,
    string? Note,
    List<CreateImportDetailDto> Details
);

public record CreateImportDetailDto(
    Guid ProductId,
    int Quantity,
    decimal Price
);

public record ImportFilterDto(
    Guid? WarehouseId,
    DateTime? StartDate,
    DateTime? EndDate,
    int PageNumber = 1,
    int PageSize = 10
);
