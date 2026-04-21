namespace QLK.Application.DTOs.Warehouse;

public record WarehouseFilterDto(
    string? Search,
    int PageNumber = 1,
    int PageSize = 10
);

public record WarehouseDto(
    Guid Id,
    string WarehouseName,
    string? Location,
    Guid ManagerId,
    string? ManagerFullName
);

public record CreateWarehouseDto(
    string WarehouseName,
    string? Location,
    Guid ManagerId
);

public record UpdateWarehouseDto(
    string WarehouseName,
    string? Location,
    Guid ManagerId
);
