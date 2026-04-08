using QLK.Application.DTOs.Auth;
using QLK.Application.DTOs.Role;

namespace QLK.Application.Services;

public interface IRoleService
{
    Task<(IEnumerable<RoleDto> Items, int TotalCount)> GetRolesAsync(RoleFilterDto filter, CancellationToken ct = default);
    Task<RoleDto?> GetRoleByIdAsync(Guid id, CancellationToken ct = default);
    Task<RoleDto> CreateRoleAsync(CreateRoleDto dto, CancellationToken ct = default);
    Task UpdateRoleAsync(Guid id, UpdateRoleDto dto, CancellationToken ct = default);
    Task DeleteRoleAsync(Guid id, CancellationToken ct = default);
    Task AssignPermissionsToRoleAsync(Guid roleId, AssignPermissionsDto dto, CancellationToken ct = default);
    Task<IEnumerable<UserDto>> GetRoleUsersAsync(Guid roleId, CancellationToken ct = default);
}
