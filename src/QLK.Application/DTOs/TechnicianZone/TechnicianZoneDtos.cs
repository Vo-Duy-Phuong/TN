namespace QLK.Application.DTOs.TechnicianZone;

/// <summary>
/// DTO đọc thông tin phân công tuyến
/// </summary>
public class TechnicianZoneDto
{
    public Guid Id { get; set; }
    public Guid TechnicianId { get; set; }
    public string TechnicianName { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}

/// <summary>
/// DTO cập nhật toàn bộ danh sách phường cho 1 kỹ thuật viên (replace all)
/// </summary>
public class UpdateTechnicianZonesDto
{
    /// <summary>
    /// Danh sách tên phường. Gửi mảng rỗng để xóa hết phân công.
    /// Ví dụ: ["Phường 1", "Mỹ Phú", "Hòa Thuận"]
    /// </summary>
    public List<string> WardNames { get; set; } = new();
}

/// <summary>
/// Summary gọn cho hiển thị trên User Card
/// </summary>
public class TechnicianZoneSummaryDto
{
    public Guid TechnicianId { get; set; }
    public List<string> WardNames { get; set; } = new();
    public int WardCount => WardNames.Count;
}
