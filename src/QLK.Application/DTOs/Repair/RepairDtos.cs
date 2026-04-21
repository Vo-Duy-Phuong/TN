using QLK.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace QLK.Application.DTOs.Repair;

public record RepairDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    Guid TechnicianId,
    string? TechnicianFullName,
    string? Problem,
    string? RepairNote,
    decimal? Cost,
    string? ImageBefore,
    string? ImageAfter,
    RepairStatus Status,
    string StatusLabel,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public class CreateRepairDto
{
    public Guid ProductId { get; set; }
    public Guid TechnicianId { get; set; }
    public string? Problem { get; set; }
    public string? RepairNote { get; set; }
    public IFormFile? ImageBeforeFile { get; set; }
}

public class UpdateRepairDto
{
    public string? Problem { get; set; }
    public string? RepairNote { get; set; }
    public decimal? Cost { get; set; }
    public string? ImageBefore { get; set; }
    public string? ImageAfter { get; set; }
    public IFormFile? ImageBeforeFile { get; set; }
    public IFormFile? ImageAfterFile { get; set; }
    public RepairStatus Status { get; set; }
}

public record RepairFilterDto(
    Guid? ProductId,
    Guid? TechnicianId,
    RepairStatus? Status,
    DateTime? StartDate,
    DateTime? EndDate,
    int PageNumber = 1,
    int PageSize = 10
);

public record RepairStatsDto(
    int TotalPending,
    int TotalRepairing,
    int TotalCompleted,
    int TotalUnrepairable,
    decimal TotalCost
);
