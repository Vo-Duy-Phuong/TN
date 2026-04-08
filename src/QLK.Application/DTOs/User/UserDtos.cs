using Microsoft.AspNetCore.Http;
using QLK.Application.DTOs.Auth;

namespace QLK.Application.DTOs.User;

public record UserFilterDto(string? Search, bool? IsActive, int PageNumber = 1, int PageSize = 10);

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public Guid RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public IFormFile? AvatarFile { get; set; }
}

public class UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public Guid RoleId { get; set; }
    public bool IsActive { get; set; }
    public IFormFile? AvatarFile { get; set; }
}

public record UpdateUserAvatarDto(string? Avatar);

