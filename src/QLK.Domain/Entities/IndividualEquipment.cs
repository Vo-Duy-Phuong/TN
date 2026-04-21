using System;

namespace QLK.Domain.Entities;

public enum EquipmentStatus
{
    InStock = 0,
    Active = 1,
    Repairing = 2,
    Retired = 3,
    Faulty = 4
}

public class IndividualEquipment
{
    public Guid Id { get; set; }
    
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    public string SerialNumber { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
    
    public EquipmentStatus Status { get; set; } = EquipmentStatus.InStock;
    
    public DateTime? InstallationDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    
    public Guid? ServiceRequestId { get; set; }
    public ServiceRequest? ServiceRequest { get; set; }

    public Guid? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    /// <summary>Phiếu nhập kho gốc (khi thiết bị được nhập vào kho)</summary>
    public Guid? ImportDetailId { get; set; }
    public ImportDetail? ImportDetail { get; set; }

    /// <summary>Phiếu xuất kho gần nhất (khi thiết bị được xuất cho KTV)</summary>
    public Guid? ExportDetailId { get; set; }
    public ExportDetail? ExportDetail { get; set; }

    /// <summary>Phiếu thu hồi gần nhất (khi thiết bị được thu hồi từ KTV)</summary>
    public Guid? RetrievalDetailId { get; set; }
    public RetrievalDetail? RetrievalDetail { get; set; }

    public string? Note { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
