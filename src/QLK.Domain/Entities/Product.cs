namespace QLK.Domain.Entities;

/// <summary>
/// Sản phẩm trong kho
/// </summary>
public class Product
{
    public Guid Id { get; set; }
    
    /// <summary>Tên sản phẩm</summary>
    public string ProductName { get; set; } = string.Empty;
    
    /// <summary>ID danh mục</summary>
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    
    /// <summary>ID thương hiệu</summary>
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;
    
    /// <summary>Số lượng hiện có</summary>
    public int Quantity { get; set; }
    
    /// <summary>Ngưỡng cảnh báo tồn kho tối thiểu</summary>
    public int MinQuantity { get; set; } = 0;

    /// <summary>Số lượng lỗi/hỏng (từ thu hồi hoặc lỗi kho)</summary>
    public int FaultyQuantity { get; set; } = 0;
    
    /// <summary>Đơn vị tính (cái, chiếc, bộ, ...)</summary>
    public string Unit { get; set; } = "cái";
    
    /// <summary>Giá sản phẩm</summary>
    public decimal Price { get; set; }
    
    /// <summary>Ảnh sản phẩm</summary>
    public string? Image { get; set; }
    
    /// <summary>Mô tả chi tiết</summary>
    public string? Description { get; set; }

    /// <summary>Link Hướng dẫn sử dụng nhanh (E-manual)</summary>
    public string? EManualUrl { get; set; }

    /// <summary>Đã xóa mềm</summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<ImportDetail> ImportDetails { get; set; } = new List<ImportDetail>();
    public ICollection<ExportDetail> ExportDetails { get; set; } = new List<ExportDetail>();
    public ICollection<Repair> Repairs { get; set; } = new List<Repair>();
    public ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
    public ICollection<RetrievalDetail> RetrievalDetails { get; set; } = new List<RetrievalDetail>();
    public ICollection<IndividualEquipment> IndividualEquipments { get; set; } = new List<IndividualEquipment>();
}
