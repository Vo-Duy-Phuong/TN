using QLK.Domain.Enums;

namespace QLK.Application.DTOs.Inventory;

public record InventoryLogDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    InventoryActionType ActionType,
    int Quantity,
    Guid UserId,
    string? UserName,
    DateTime CreatedAt
);

public record InventoryLogFilterDto(
    Guid? ProductId,
    InventoryActionType? ActionType,
    DateTime? StartDate,
    DateTime? EndDate,
    int PageNumber = 1,
    int PageSize = 20
);
