namespace QLK.Domain.Entities;

/// <summary>
/// Vai trò người dùng (Admin, WarehouseManager, Technician)
/// </summary>
public class Role
{
    public Guid Id { get; set; }

    /// <summary>Mã vai trò (ví dụ: ADMIN, WAREHOUSE_MANAGER, TECHNICIAN)</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Tên vai trò</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Mô tả vai trò</summary>
    public string? Description { get; set; }

    /// <summary>Vai trò hệ thống (không được xóa)</summary>
    public bool IsSystemRole { get; set; } = false;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
