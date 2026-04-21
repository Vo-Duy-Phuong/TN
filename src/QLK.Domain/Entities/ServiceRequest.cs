using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

public class ServiceRequest
{
    public Guid Id { get; set; }
    
    // Customer Info
    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ServiceType { get; set; } = "Lắp đặt mới";
    public string? SelectedPackage { get; set; }  // Gói dịch vụ khách hàng chọn
    public string? Description { get; set; }
    
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    
    // Status & Tracking
    public ServiceStatus Status { get; set; } = ServiceStatus.Pending;
    public string? AdminNote { get; set; }
    
    // Assignments
    public Guid? AssignedTechnicianId { get; set; }
    public User? AssignedTechnician { get; set; }
    
    public Guid? ProcessedById { get; set; }
    public User? ProcessedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<ServiceRequestEquipment> EquipmentsUsed { get; set; } = new List<ServiceRequestEquipment>();
}
