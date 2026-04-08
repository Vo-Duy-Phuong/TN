using QLK.Application.DTOs.Auth;
using QLK.Application.DTOs.Permission;

namespace QLK.Application.DTOs.Role;

public record RoleDto(Guid Id, string Code, string Name, string? Description, bool IsSystemRole, DateTime CreatedAt, IEnumerable<PermissionDto> Permissions);
public record CreateRoleDto(string Code, string Name, string? Description);
public record UpdateRoleDto(string Name, string? Description);
public record AssignPermissionsDto(List<Guid> PermissionIds);
public record RoleFilterDto(string? Search, int PageNumber = 1, int PageSize = 20);
