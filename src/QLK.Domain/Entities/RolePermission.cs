namespace QLK.Domain.Entities;

/// <summary>
/// Bảng trung gian gán quyền cho vai trò
/// </summary>
public class RolePermission
{
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
