namespace QLK.Domain.Entities;

/// <summary>
/// Chi tiết phiếu xuất kho
/// </summary>
public class ExportDetail
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID phiếu xuất (FK to ExportReceipt table)
    /// </summary>
    public Guid ExportId { get; set; }
    public ExportReceipt ExportReceipt { get; set; } = null!;
    
    /// <summary>
    /// ID sản phẩm (FK to Product table)
    /// </summary>
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    /// <summary>
    /// Số lượng xuất
    /// </summary>
    public int Quantity { get; set; }

    // Navigation: thiết bị cá thể được xuất theo dòng này
    public ICollection<IndividualEquipment> IndividualEquipments { get; set; } = new List<IndividualEquipment>();
}
