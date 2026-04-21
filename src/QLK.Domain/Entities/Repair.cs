using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

/// <summary>
/// Quản lý sửa chữa sản phẩm
/// </summary>
public class Repair
{
    public Guid Id { get; set; }
    
    /// <summary>ID sản phẩm cần sửa (FK to Product table)</summary>
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    /// <summary>ID kỹ thuật viên sửa chữa (FK to User table)</summary>
    public Guid TechnicianId { get; set; }
    public User Technician { get; set; } = null!;
    
    /// <summary>Mô tả lỗi/vấn đề</summary>
    public string? Problem { get; set; }
    
    /// <summary>Ghi chú nội bộ của kỹ thuật viên</summary>
    public string? RepairNote { get; set; }
    
    /// <summary>Chi phí sửa chữa</summary>
    public decimal? Cost { get; set; }
    
    /// <summary>Ảnh trước khi sửa</summary>
    public string? ImageBefore { get; set; }
    
    /// <summary>Ảnh sau khi sửa</summary>
    public string? ImageAfter { get; set; }
    
    /// <summary>Trạng thái sửa chữa</summary>
    public RepairStatus Status { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
