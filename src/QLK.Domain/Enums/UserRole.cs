namespace QLK.Domain.Enums;

// UserRole enum đã được thay thế bằng Role entity với Code property
// Ví dụ codes: "ADMIN", "WAREHOUSE_MANAGER", "TECHNICIAN"
// File này được giữ lại để tránh lỗi references cũ
[Obsolete("Dùng Role.Code thay thế")]
public enum UserRole
{
    Admin = 1,
    WarehouseManager = 2,
    Technician = 3
}
