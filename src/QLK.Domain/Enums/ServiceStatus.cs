namespace QLK.Domain.Enums;

public enum ServiceStatus
{
    Pending = 0,    // Chờ duyệt
    Approved = 1,   // Đã duyệt
    Assigned = 2,   // Đã phân công kỹ thuật
    Completed = 3,  // Đã hoàn thành lắp đặt
    Cancelled = 4   // Đã hủy
}
