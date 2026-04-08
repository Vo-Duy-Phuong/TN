using QLK.Domain.Enums;

namespace QLK.Application.DTOs.Repair;

public record RepairDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    Guid TechnicianId,
    string? TechnicianFullName,
    string? Problem,
    string? ImageBefore,
    string? ImageAfter,
    RepairStatus Status,
    DateTime CreatedAt
);

public record CreateRepairDto(
    Guid ProductId,
    Guid TechnicianId,
    string? Problem,
    string? ImageBefore
);

public record UpdateRepairDto(
    string? Problem,
    string? ImageBefore,
    string? ImageAfter,
    RepairStatus Status
);

public record RepairFilterDto(
    Guid? ProductId,
    Guid? TechnicianId,
    RepairStatus? Status,
    int PageNumber = 1,
    int PageSize = 10
);
