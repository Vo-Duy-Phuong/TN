namespace QLK.Domain.Entities;

/// <summary>
/// Chi tiết phiếu thu hồi thiết bị
/// </summary>
public class RetrievalDetail
{
    public Guid Id { get; set; }
    
    /// <summary>ID phiếu thu hồi (FK to RetrievalReceipt table)</summary>
    public Guid RetrievalReceiptId { get; set; }
    public RetrievalReceipt RetrievalReceipt { get; set; } = null!;
    
    /// <summary>ID sản phẩm (FK to Product table)</summary>
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    /// <summary>Số lượng thu hồi</summary>
    public int Quantity { get; set; }
    
    /// <summary>Tình trạng thiết bị khi thu hồi (Mới, Cũ, Hỏng...)</summary>
    public string? Condition { get; set; }

    // Navigation: thiết bị cá thể được thu hồi theo dòng này
    public ICollection<IndividualEquipment> IndividualEquipments { get; set; } = new List<IndividualEquipment>();
}
