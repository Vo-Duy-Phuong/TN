using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

/// <summary>
/// Nhật ký thay đổi tồn kho
/// </summary>
public class InventoryLog
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID sản phẩm (FK to Product table)
    /// </summary>
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    /// <summary>
    /// Loại hành động (Import, Export, Repair)
    /// </summary>
    public InventoryActionType ActionType { get; set; }
    
    /// <summary>
    /// Số lượng thay đổi
    /// </summary>
    public int Quantity { get; set; }
    
    /// <summary>
    /// ID người thực hiện (FK to User table)
    /// </summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
