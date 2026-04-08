namespace QLK.Domain.Entities;

/// <summary>
/// Thương hiệu sản phẩm
/// </summary>
public class Brand
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên thương hiệu
    /// </summary>
    public string BrandName { get; set; } = string.Empty;
    
    /// <summary>
    /// Logo thương hiệu (đường dẫn file)
    /// </summary>
    public string? Logo { get; set; }
    
    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
