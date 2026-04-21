using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

/// <summary>
/// Phiếu nhập kho
/// </summary>
public class ImportReceipt
{
    public Guid Id { get; set; }
    
    /// <summary>Mã phiếu nhập tự sinh (PN-YYYYMMDD-XXX)</summary>
    public string ReceiptCode { get; set; } = string.Empty;
    
    /// <summary>ID kho nhập (FK to Warehouse table)</summary>
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    
    /// <summary>ID người lập phiếu (FK to User table)</summary>
    public Guid CreatedBy { get; set; }
    public User Creator { get; set; } = null!;
    
    public DateTime ImportDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>File hóa đơn (đường dẫn file trên MinIO)</summary>
    public string? InvoiceFile { get; set; }
    
    /// <summary>Ghi chú</summary>
    public string? Note { get; set; }
    
    /// <summary>Trạng thái phiếu</summary>
    public ReceiptStatus Status { get; set; } = ReceiptStatus.Completed;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<ImportDetail> ImportDetails { get; set; } = new List<ImportDetail>();
}
