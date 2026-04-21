using System;

namespace QLK.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete
    public string EntityName { get; set; } = string.Empty; // Product, User, etc.
    public string EntityId { get; set; } = string.Empty;
    public string? Changes { get; set; } // JSON format: {"Name": ["Old", "New"]}
    public string? MachineName { get; set; }
    public string? RemoteIpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
