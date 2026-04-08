using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Auth;
using QLK.Application.DTOs.User;
using QLK.Domain.Entities;
using QLK.Domain.Interfaces;
using QLK.Infrastructure.Data;
using QLK.Infrastructure.Security;

namespace QLK.Application.Services;

public interface IUserService
{
    Task<(IEnumerable<UserDto> Items, int TotalCount)> GetUsersAsync(UserFilterDto filter, CancellationToken ct = default);
    Task<UserDto?> GetUserByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserDto> CreateUserAsync(CreateUserDto dto, CancellationToken ct = default);
    Task UpdateUserAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default);
    Task DeleteUserAsync(Guid id, CancellationToken ct = default);
    Task UpdatePasswordAsync(Guid id, string newPassword, CancellationToken ct = default);
    Task UpdateAvatarAsync(Guid id, string? avatar, CancellationToken ct = default);
}

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public UserService(ApplicationDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<(IEnumerable<UserDto> Items, int TotalCount)> GetUsersAsync(UserFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(u => u.Username.ToLower().Contains(search) || u.FullName.ToLower().Contains(search) || u.Email.ToLower().Contains(search));
        }

        if (filter.IsActive.HasValue)
            query = query.Where(u => u.IsActive == filter.IsActive.Value);

        var totalCount = await query.CountAsync(ct);
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<UserDto>();
        foreach (var user in users)
        {
            dtos.Add(await MapToDtoAsync(user));
        }

        return (dtos, totalCount);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        return user == null ? null : await MapToDtoAsync(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == dto.Username, ct))
            throw new ArgumentException($"Tên đăng nhập '{dto.Username}' đã tồn tại.");

        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == dto.Email, ct))
            throw new ArgumentException($"Email '{dto.Email}' đã tồn tại.");

        var role = await _context.Roles.FindAsync(new object[] { dto.RoleId }, ct);
        if (role == null) throw new ArgumentException("Vai trò không hợp lệ.");

        string? avatar = null;
        if (dto.AvatarFile != null)
        {
            using var stream = dto.AvatarFile.OpenReadStream();
            avatar = await _storageService.UploadFileAsync(stream, dto.AvatarFile.FileName, dto.AvatarFile.ContentType);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            PasswordHash = PasswordHasher.HashPassword(dto.Password),
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            RoleId = dto.RoleId,
            Avatar = avatar,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(user, ct);
        await _context.SaveChangesAsync(ct);

        return await MapToDtoAsync(user);
    }

    public async Task UpdateUserAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) throw new ArgumentException("Không tìm thấy người dùng.");

        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == dto.Email && u.Id != id, ct))
            throw new ArgumentException($"Email '{dto.Email}' đã tồn tại.");

        var role = await _context.Roles.FindAsync(new object[] { dto.RoleId }, ct);
        if (role == null) throw new ArgumentException("Vai trò không hợp lệ.");

        if (dto.AvatarFile != null)
        {
            // Delete old avatar if exists (optional, could lead to issues if shared)
            using var stream = dto.AvatarFile.OpenReadStream();
            user.Avatar = await _storageService.UploadFileAsync(stream, dto.AvatarFile.FileName, dto.AvatarFile.ContentType);
        }

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.RoleId = dto.RoleId;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteUserAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) throw new ArgumentException("Không tìm thấy người dùng.");

        // Kiểm tra xem user có đang quản lý kho nào không
        var isManager = await _context.Warehouses.AnyAsync(w => w.ManagerId == id, ct);
        if (isManager) throw new InvalidOperationException("Không thể xóa người dùng đang quản lý kho.");

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdatePasswordAsync(Guid id, string newPassword, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) throw new ArgumentException("Không tìm thấy người dùng.");

        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAvatarAsync(Guid id, string? avatar, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) throw new ArgumentException("Không tìm thấy người dùng.");

        user.Avatar = avatar;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    private async Task<UserDto> MapToDtoAsync(User u)
    {
        var avatarUrl = !string.IsNullOrEmpty(u.Avatar) 
            ? await _storageService.GetFileUrlAsync(u.Avatar) 
            : null;

        return new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            FullName = u.FullName,
            Email = u.Email,
            Phone = u.Phone,
            Avatar = avatarUrl ?? u.Avatar, // Provide URL if possible, fallback to filename
            RoleId = u.RoleId,
            RoleCode = u.Role?.Code ?? string.Empty,
            RoleName = u.Role?.Name ?? string.Empty,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            Permissions = u.Role?.RolePermissions
                .Select(rp => rp.Permission.Code)
                .ToList() ?? new List<string>()
        };
    }
}
