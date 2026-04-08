namespace QLK.Domain.Entities;

/// <summary>
/// Quyền hạn cụ thể trong hệ thống
/// </summary>
public class Permission
{
    public Guid Id { get; set; }

    /// <summary>Mã quyền (ví dụ: Products.View, Warehouse.Create)</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Tên quyền (hiển thị)</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Mô tả quyền</summary>
    public string? Description { get; set; }

    /// <summary>Nhóm quyền (Products, Warehouse, Import, Export, Repair, Users, Roles)</summary>
    public string Category { get; set; } = string.Empty;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
