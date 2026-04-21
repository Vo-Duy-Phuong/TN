using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

/// <summary>
/// Phiếu thu hồi thiết bị
/// </summary>
public class RetrievalReceipt
{
    public Guid Id { get; set; }
    
    /// <summary>Mã phiếu thu hồi tự sinh (TH-YYYYMMDD-XXX)</summary>
    public string ReceiptCode { get; set; } = string.Empty;
    
    /// <summary>ID kho nhận hàng (FK to Warehouse table)</summary>
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    
    /// <summary>ID kỹ thuật viên trả hàng (FK to User table)</summary>
    public Guid TechnicianId { get; set; }
    public User Technician { get; set; } = null!;
    
    public DateTime RetrievalDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>Ghi chú</summary>
    public string? Note { get; set; }
    
    /// <summary>Trạng thái phiếu</summary>
    public ReceiptStatus Status { get; set; } = ReceiptStatus.Completed;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<RetrievalDetail> RetrievalDetails { get; set; } = new List<RetrievalDetail>();
}
