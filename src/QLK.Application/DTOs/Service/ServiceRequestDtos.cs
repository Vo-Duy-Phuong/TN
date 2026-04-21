using QLK.Domain.Enums;

namespace QLK.Application.DTOs.Service;

public record ServiceRequestDto(
    Guid Id,
    string CustomerName,
    string PhoneNumber,
    string Address,
    string ServiceType,
    string? SelectedPackage,
    string? Description,
    ServiceStatus Status,
    string? AdminNote,
    Guid? AssignedTechnicianId,
    string? AssignedTechnicianName,
    Guid? ProcessedById,
    string? ProcessedByName,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    double? Latitude = 0,
    double? Longitude = 0
);

public class CreateServiceRequestDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ServiceType { get; set; } = "Lắp đặt mới";
    public string? SelectedPackage { get; set; }
    public string? Description { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class ProcessServiceRequestDto
{
    public ServiceStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public Guid? AssignedTechnicianId { get; set; }
}

public record ServiceRequestFilterDto(
    string? Search,
    ServiceStatus? Status,
    Guid? AssignedTechnicianId = null,
    int PageNumber = 1,
    int PageSize = 10
);
