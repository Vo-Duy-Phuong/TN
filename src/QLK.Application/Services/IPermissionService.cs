using QLK.Application.DTOs.Permission;
using QLK.Application.DTOs.Role;

namespace QLK.Application.Services;

public interface IPermissionService
{
    Task<IEnumerable<PermissionDto>> GetPermissionsAsync(CancellationToken ct = default);
    Task<IEnumerable<PermissionDto>> GetPermissionsByCategoryAsync(string category, CancellationToken ct = default);
    Task<PermissionDto?> GetPermissionByIdAsync(Guid id, CancellationToken ct = default);
    Task<PermissionDto> CreatePermissionAsync(CreatePermissionDto dto, CancellationToken ct = default);
    Task UpdatePermissionAsync(Guid id, UpdatePermissionDto dto, CancellationToken ct = default);
    Task DeletePermissionAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<string>> GetCategoriesAsync(CancellationToken ct = default);
}
