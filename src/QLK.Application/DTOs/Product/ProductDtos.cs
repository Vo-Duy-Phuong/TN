using Microsoft.AspNetCore.Http;

namespace QLK.Application.DTOs.Product;

public record ProductFilterDto(string? Search, Guid? CategoryId, Guid? BrandId, int PageNumber = 1, int PageSize = 10);

public record ProductDto(
    Guid Id,
    string ProductName,
    Guid CategoryId,
    string? CategoryName,
    Guid BrandId,
    string? BrandName,
    int Quantity,
    decimal Price,
    string? Image,
    string? Description,
    DateTime CreatedAt
);

public class CreateProductDto
{
    public string ProductName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public string? Description { get; set; }
    public IFormFile? ImageFile { get; set; }
}

public class UpdateProductDto
{
    public string ProductName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public string? Description { get; set; }
    public IFormFile? ImageFile { get; set; }
}

