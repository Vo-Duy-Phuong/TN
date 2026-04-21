using System;

namespace QLK.Domain.Entities;

/// <summary>
/// Track equipment/products used in a service request (installation)
/// </summary>
public class ServiceRequestEquipment
{
    public Guid Id { get; set; }
    
    public Guid ServiceRequestId { get; set; }
    public ServiceRequest ServiceRequest { get; set; } = null!;
    
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    public int Quantity { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
