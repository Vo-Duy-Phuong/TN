using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

/// <summary>
/// Phiếu xuất kho
/// </summary>
public class ExportReceipt
{
    public Guid Id { get; set; }
    
    /// <summary>Mã phiếu xuất tự sinh (PX-YYYYMMDD-XXX)</summary>
    public string ReceiptCode { get; set; } = string.Empty;
    
    /// <summary>ID kho xuất (FK to Warehouse table)</summary>
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    
    /// <summary>ID kỹ thuật viên nhận hàng (FK to User table)</summary>
    public Guid TechnicianId { get; set; }
    public User Technician { get; set; } = null!;
    
    public DateTime ExportDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>File chứng từ xuất (đường dẫn file trên MinIO)</summary>
    public string? ExportFile { get; set; }
    
    /// <summary>Ghi chú</summary>
    public string? Note { get; set; }
    
    /// <summary>Trạng thái phiếu</summary>
    public ReceiptStatus Status { get; set; } = ReceiptStatus.Completed;
    
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>Liên kết với yêu cầu dịch vụ (để quyết toán vật tư)</summary>
    public Guid? ServiceRequestId { get; set; }
    public ServiceRequest? ServiceRequest { get; set; }
    
    // Navigation properties
    public ICollection<ExportDetail> ExportDetails { get; set; } = new List<ExportDetail>();
}
