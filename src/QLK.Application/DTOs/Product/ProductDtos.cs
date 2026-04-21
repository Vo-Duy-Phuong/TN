using Microsoft.AspNetCore.Http;

namespace QLK.Application.DTOs.Product;

public record ProductFilterDto(
    string? Search,
    Guid? CategoryId,
    Guid? BrandId,
    bool? LowStock,       // Lọc sản phẩm tồn kho thấp (qty < minQty)
    int PageNumber = 1,
    int PageSize = 10
);

public record ProductDto(
    Guid Id,
    string ProductName,
    Guid CategoryId,
    string? CategoryName,
    Guid BrandId,
    string? BrandName,
    int Quantity,
    int MinQuantity,
    string Unit,
    decimal Price,
    string? Image,
    string? Description,
    bool IsLowStock,      // Cảnh báo tồn kho thấp
    int FaultyQuantity,   // Số lượng lỗi/hỏng
    int? DaysRemaining,   // Dự báo số ngày còn lại (AI)
    double? ConsumptionRate, // Tốc độ tiêu thụ (món/ngày)
    string? EManualUrl,   // Link hướng dẫn sử dụng
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public class CreateProductDto
{
    public string ProductName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public int Quantity { get; set; }
    public int MinQuantity { get; set; } = 0;
    public string Unit { get; set; } = "cái";
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public string? Description { get; set; }
    public string? EManualUrl { get; set; }
    public IFormFile? ImageFile { get; set; }
}

public class UpdateProductDto
{
    public string ProductName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public int MinQuantity { get; set; } = 0;
    public int FaultyQuantity { get; set; } = 0;
    public string Unit { get; set; } = "cái";
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public string? Description { get; set; }
    public string? EManualUrl { get; set; }
    public IFormFile? ImageFile { get; set; }
}

public record LowStockProductDto(
    Guid Id,
    string ProductName,
    string? CategoryName,
    string? BrandName,
    int Quantity,
    int MinQuantity,
    string Unit,
    decimal Price
);
