using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Permission;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;


public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _context;

    public PermissionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PermissionDto>> GetPermissionsAsync(CancellationToken ct = default)
    {
        var perms = await _context.Permissions
            .OrderBy(p => p.Category).ThenBy(p => p.Name)
            .ToListAsync(ct);
        return perms.Select(MapToDto);
    }

    public async Task<IEnumerable<PermissionDto>> GetPermissionsByCategoryAsync(string category, CancellationToken ct = default)
    {
        var perms = await _context.Permissions
            .Where(p => p.Category == category)
            .OrderBy(p => p.Name)
            .ToListAsync(ct);
        return perms.Select(MapToDto);
    }

    public async Task<PermissionDto?> GetPermissionByIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _context.Permissions.FindAsync(new object[] { id }, ct);
        return p == null ? null : MapToDto(p);
    }

    public async Task<PermissionDto> CreatePermissionAsync(CreatePermissionDto dto, CancellationToken ct = default)
    {
        if (await _context.Permissions.AnyAsync(p => p.Code == dto.Code, ct))
            throw new ArgumentException($"Quyền với mã '{dto.Code}' đã tồn tại.");

        var permission = new Permission
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Permissions.AddAsync(permission, ct);
        await _context.SaveChangesAsync(ct);
        return MapToDto(permission);
    }

    public async Task UpdatePermissionAsync(Guid id, UpdatePermissionDto dto, CancellationToken ct = default)
    {
        var p = await _context.Permissions.FindAsync(new object[] { id }, ct);
        if (p == null) throw new ArgumentException("Không tìm thấy quyền.");

        p.Name = dto.Name;
        p.Description = dto.Description;
        p.Category = dto.Category;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeletePermissionAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _context.Permissions
            .Include(x => x.RolePermissions)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (p == null) throw new ArgumentException("Không tìm thấy quyền.");
        if (p.RolePermissions.Any())
            throw new InvalidOperationException($"Không thể xóa quyền '{p.Name}' vì đang được gán cho {p.RolePermissions.Count} vai trò.");

        p.IsDeleted = true;
        p.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<string>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _context.Permissions
            .Select(p => p.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(ct);
    }

    private static PermissionDto MapToDto(Permission p) =>
        new PermissionDto(p.Id, p.Code, p.Name, p.Description, p.Category);
}
