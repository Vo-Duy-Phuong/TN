using QLK.Domain.Enums;
using QLK.Application.DTOs.Import;

namespace QLK.Application.DTOs.Retrieval;

public class RetrievalReceiptDto
{
    public Guid Id { get; set; }
    public string ReceiptCode { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid TechnicianId { get; set; }
    public string TechnicianName { get; set; } = string.Empty;
    public DateTime RetrievalDate { get; set; }
    public string? Note { get; set; }
    public ReceiptStatus Status { get; set; }
    public List<RetrievalDetailDto> Details { get; set; } = new();
}

public class RetrievalDetailDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Condition { get; set; }
    public List<IndividualEquipmentSummaryDto> Equipments { get; set; } = new();
}

public class CreateRetrievalDto
{
    public Guid WarehouseId { get; set; }
    public Guid TechnicianId { get; set; }
    public string? Note { get; set; }
    public List<CreateRetrievalDetailDto> Details { get; set; } = new();
}

public class CreateRetrievalDetailDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public string? Condition { get; set; }
    
    /// <summary>Danh sách Serial Numbers của thiết bị được thu hồi</summary>
    public List<string> SerialNumbers { get; set; } = new();
}
