namespace QLK.Domain.Entities;

/// <summary>
/// Sản phẩm trong kho
/// </summary>
public class Product
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên sản phẩm
    /// </summary>
    public string ProductName { get; set; } = string.Empty;
    
    /// <summary>
    /// ID danh mục
    /// </summary>
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    
    /// <summary>
    /// ID thương hiệu
    /// </summary>
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;
    
    /// <summary>
    /// Số lượng hiện có
    /// </summary>
    public int Quantity { get; set; }
    
    /// <summary>
    /// Giá sản phẩm
    /// </summary>
    public decimal Price { get; set; }
    
    /// <summary>
    /// Ảnh sản phẩm
    /// </summary>
    public string? Image { get; set; }
    
    /// <summary>
    /// Mô tả chi tiết
    /// </summary>
    public string? Description { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<ImportDetail> ImportDetails { get; set; } = new List<ImportDetail>();
    public ICollection<ExportDetail> ExportDetails { get; set; } = new List<ExportDetail>();
    public ICollection<Repair> Repairs { get; set; } = new List<Repair>();
    public ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
}
