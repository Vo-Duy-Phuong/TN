namespace QLK.Domain.Entities;

/// <summary>
/// Kho lưu trữ sản phẩm
/// </summary>
public class Warehouse
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên kho
    /// </summary>
    public string WarehouseName { get; set; } = string.Empty;
    
    /// <summary>
    /// Địa điểm kho
    /// </summary>
    public string? Location { get; set; }
    
    /// <summary>
    /// ID quản lý kho (FK to User table)
    /// </summary>
    public Guid ManagerId { get; set; }
    public User Manager { get; set; } = null!;
    
    // Navigation properties
    public ICollection<ImportReceipt> ImportReceipts { get; set; } = new List<ImportReceipt>();
    public ICollection<ExportReceipt> ExportReceipts { get; set; } = new List<ExportReceipt>();
    public ICollection<RetrievalReceipt> RetrievalReceipts { get; set; } = new List<RetrievalReceipt>();
}
