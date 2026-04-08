namespace QLK.Application.DTOs.Category;

public record CategoryDto(Guid Id, string CategoryName, string? Description);

public record CreateCategoryDto(string CategoryName, string? Description);

public record UpdateCategoryDto(string CategoryName, string? Description);
