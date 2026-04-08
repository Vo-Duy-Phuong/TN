namespace QLK.Application.DTOs.Permission;

public record PermissionDto(Guid Id, string Code, string Name, string? Description, string Category);
public record CreatePermissionDto(string Code, string Name, string? Description, string Category);
public record UpdatePermissionDto(string Name, string? Description, string Category);
