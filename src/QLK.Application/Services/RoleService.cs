using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Auth;
using QLK.Application.DTOs.Role;
using QLK.Application.DTOs.Permission;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;


public class RoleService : IRoleService
{
    private readonly ApplicationDbContext _context;

    public RoleService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<RoleDto> Items, int TotalCount)> GetRolesAsync(RoleFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(s) || r.Code.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(ct);
        var roles = await query
            .OrderBy(r => r.Code)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (roles.Select(MapToDto), totalCount);
    }

    public async Task<RoleDto?> GetRoleByIdAsync(Guid id, CancellationToken ct = default)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        return role == null ? null : MapToDto(role);
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleDto dto, CancellationToken ct = default)
    {
        if (await _context.Roles.AnyAsync(r => r.Code == dto.Code.ToUpper(), ct))
            throw new ArgumentException($"Vai trò với mã '{dto.Code}' đã tồn tại.");

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            Description = dto.Description,
            IsSystemRole = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Roles.AddAsync(role, ct);
        await _context.SaveChangesAsync(ct);

        return MapToDto(role);
    }

    public async Task UpdateRoleAsync(Guid id, UpdateRoleDto dto, CancellationToken ct = default)
    {
        var role = await _context.Roles.FindAsync(new object[] { id }, ct);
        if (role == null) throw new ArgumentException("Không tìm thấy vai trò.");
        if (role.IsSystemRole) throw new InvalidOperationException("Không thể chỉnh sửa vai trò hệ thống.");

        role.Name = dto.Name;
        role.Description = dto.Description;
        role.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteRoleAsync(Guid id, CancellationToken ct = default)
    {
        var role = await _context.Roles
            .Include(r => r.Users)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (role == null) throw new ArgumentException("Không tìm thấy vai trò.");
        if (role.IsSystemRole) throw new InvalidOperationException("Không thể xóa vai trò hệ thống.");
        if (role.Users.Any()) throw new InvalidOperationException($"Không thể xóa vai trò đang có {role.Users.Count} người dùng.");

        role.IsDeleted = true;
        role.DeletedAt = DateTime.UtcNow;
        role.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task AssignPermissionsToRoleAsync(Guid roleId, AssignPermissionsDto dto, CancellationToken ct = default)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId, ct);

        if (role == null) throw new ArgumentException("Không tìm thấy vai trò.");
        if (role.Code == "ADMIN") throw new InvalidOperationException("Không thể chỉnh sửa quyền của Admin.");

        _context.RolePermissions.RemoveRange(role.RolePermissions);

        var newPerms = dto.PermissionIds.Distinct().Select(pid => new RolePermission
        {
            RoleId = roleId,
            PermissionId = pid,
            AssignedAt = DateTime.UtcNow
        });

        await _context.RolePermissions.AddRangeAsync(newPerms, ct);
        role.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<UserDto>> GetRoleUsersAsync(Guid roleId, CancellationToken ct = default)
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.RoleId == roleId)
            .ToListAsync(ct);

        return users.Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            FullName = u.FullName,
            Email = u.Email,
            Phone = u.Phone,
            RoleId = u.RoleId,
            RoleCode = u.Role.Code,
            RoleName = u.Role.Name,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
        });
    }

    private static RoleDto MapToDto(Role r) => new RoleDto(
        r.Id, r.Code, r.Name, r.Description, r.IsSystemRole, r.CreatedAt,
        r.RolePermissions
            .Where(rp => !rp.Permission.IsDeleted)
            .Select(rp => new PermissionDto(rp.Permission.Id, rp.Permission.Code, rp.Permission.Name, rp.Permission.Description, rp.Permission.Category))
    );
}
