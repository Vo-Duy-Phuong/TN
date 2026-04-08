namespace QLK.Domain.Entities;

/// <summary>
/// Danh mục sản phẩm
/// </summary>
public class Category
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên danh mục
    /// </summary>
    public string CategoryName { get; set; } = string.Empty;
    
    /// <summary>
    /// Mô tả
    /// </summary>
    public string? Description { get; set; }
    
    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
