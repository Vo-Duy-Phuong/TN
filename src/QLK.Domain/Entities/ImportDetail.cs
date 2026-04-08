namespace QLK.Domain.Entities;

/// <summary>
/// Chi tiết phiếu nhập kho
/// </summary>
public class ImportDetail
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID phiếu nhập (FK to ImportReceipt table)
    /// </summary>
    public Guid ImportId { get; set; }
    public ImportReceipt ImportReceipt { get; set; } = null!;
    
    /// <summary>
    /// ID sản phẩm (FK to Product table)
    /// </summary>
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    /// <summary>
    /// Số lượng nhập
    /// </summary>
    public int Quantity { get; set; }
    
    /// <summary>
    /// Giá nhập
    /// </summary>
    public decimal Price { get; set; }
}
