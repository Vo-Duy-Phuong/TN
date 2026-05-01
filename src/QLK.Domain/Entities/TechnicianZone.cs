namespace QLK.Domain.Entities;

/// <summary>
/// Phân công tuyến phường cho kỹ thuật viên.
/// Mỗi bản ghi = 1 kỹ thuật viên phụ trách 1 phường.
/// </summary>
public class TechnicianZone
{
    public Guid Id { get; set; }

    /// <summary>Kỹ thuật viên phụ trách</summary>
    public Guid TechnicianId { get; set; }
    public User Technician { get; set; } = null!;

    /// <summary>Tên phường (ví dụ: "Phường 1", "Mỹ Phú")</summary>
    public string WardName { get; set; } = string.Empty;

    /// <summary>Quận / Huyện (mặc định: "TP. Cao Lãnh")</summary>
    public string District { get; set; } = "TP. Cao Lãnh";

    /// <summary>Tỉnh / Thành phố</summary>
    public string Province { get; set; } = "Đồng Tháp";

    /// <summary>Ngày phân công</summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
