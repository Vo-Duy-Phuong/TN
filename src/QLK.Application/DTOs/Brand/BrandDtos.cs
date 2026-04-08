namespace QLK.Application.DTOs.Brand;

public record BrandDto(Guid Id, string BrandName, string? Logo);

public record CreateBrandDto(string BrandName, string? Logo);

public record UpdateBrandDto(string BrandName, string? Logo);
