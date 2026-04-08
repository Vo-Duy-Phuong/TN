using QLK.Domain.Enums;

namespace QLK.Domain.Entities;

/// <summary>
/// Thông báo trong hệ thống (SignalR real-time)
/// </summary>
public class Notification
{
    public Guid Id { get; set; }

    /// <summary>ID người nhận</summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>Tiêu đề thông báo</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Nội dung thông báo</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Loại thông báo</summary>
    public NotificationType Type { get; set; } = NotificationType.Info;

    /// <summary>Đường dẫn liên quan</summary>
    public string? Link { get; set; }

    /// <summary>ID phiếu nhập/xuất/sửa chữa liên quan</summary>
    public Guid? RelatedEntityId { get; set; }

    /// <summary>Loại entity liên quan (Import, Export, Repair)</summary>
    public string? RelatedEntityType { get; set; }

    /// <summary>Trạng thái đã đọc</summary>
    public bool IsRead { get; set; } = false;

    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
