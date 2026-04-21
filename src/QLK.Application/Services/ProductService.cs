using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Product;
using QLK.Domain.Entities;
using QLK.Domain.Interfaces;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IProductService
{
    Task<(IEnumerable<ProductDto> Items, int TotalCount)> GetProductsAsync(ProductFilterDto filter, CancellationToken ct = default);
    Task<ProductDto?> GetProductByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct = default);
    Task UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default);
    Task DeleteProductAsync(Guid id, CancellationToken ct = default);
    Task UpdateQuantityAsync(Guid id, int change, CancellationToken ct = default);
    Task<IEnumerable<LowStockProductDto>> GetLowStockProductsAsync(CancellationToken ct = default);
}

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly IAuditService _auditService;

    public ProductService(ApplicationDbContext context, IStorageService storageService, IAuditService auditService)
    {
        _context = context;
        _storageService = storageService;
        _auditService = auditService;
    }

    public async Task<(IEnumerable<ProductDto> Items, int TotalCount)> GetProductsAsync(ProductFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            
            // Try to parse search as GUID
            if (Guid.TryParse(filter.Search, out var guidId))
            {
                query = query.Where(p => p.Id == guidId || 
                                        p.ProductName.ToLower().Contains(search) || 
                                        (p.Description != null && p.Description.ToLower().Contains(search)));
            }
            else
            {
                query = query.Where(p => p.ProductName.ToLower().Contains(search) || 
                                        (p.Description != null && p.Description.ToLower().Contains(search)));
            }
        }

        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

        if (filter.BrandId.HasValue)
            query = query.Where(p => p.BrandId == filter.BrandId.Value);

        if (filter.LowStock == true)
            query = query.Where(p => p.Quantity <= p.MinQuantity);

        var totalCount = await query.CountAsync(ct);
        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<ProductDto>();

        // Fix N+1: batch-fetch 30-day usage for all products in a single GROUP BY query
        var productIds = products.Select(p => p.Id).ToList();
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var usageByProduct = await _context.ExportDetails
            .Where(ed => productIds.Contains(ed.ProductId)
                      && ed.ExportReceipt.ExportDate >= thirtyDaysAgo)
            .GroupBy(ed => ed.ProductId)
            .Select(g => new { ProductId = g.Key, TotalUsage = g.Sum(ed => ed.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.TotalUsage, ct);

        foreach (var product in products)
            dtos.Add(await MapToDtoAsync(product, usageByProduct.GetValueOrDefault(product.Id, 0)));

        return (dtos, totalCount);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);

        if (product == null) return null;

        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var recentUsage = await _context.ExportDetails
            .Where(ed => ed.ProductId == id && ed.ExportReceipt.ExportDate >= thirtyDaysAgo)
            .SumAsync(ed => (int?)ed.Quantity, ct) ?? 0;

        return await MapToDtoAsync(product, recentUsage);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto, CancellationToken ct = default)
    {
        string? image = dto.Image;
        if (dto.ImageFile != null)
        {
            using var stream = dto.ImageFile.OpenReadStream();
            image = await _storageService.UploadFileAsync(stream, dto.ImageFile.FileName, dto.ImageFile.ContentType);
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProductName = dto.ProductName,
            CategoryId = dto.CategoryId,
            BrandId = dto.BrandId,
            Quantity = dto.Quantity,
            MinQuantity = dto.MinQuantity,
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "cái" : dto.Unit,
            Price = dto.Price,
            Image = image,
            Description = dto.Description,
            EManualUrl = dto.EManualUrl,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Products.AddAsync(product, ct);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync("Tạo mới", "Sản phẩm", product.Id.ToString(), $"Tạo sản phẩm: {product.ProductName}", ct);

        // Reload with includes
        product = (await _context.Products.Include(p => p.Category).Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == product.Id, ct))!;

        return await MapToDtoAsync(product, 0);
    }

    public async Task UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        if (product == null || product.IsDeleted)
            throw new ArgumentException("Không tìm thấy sản phẩm.");

        if (dto.ImageFile != null)
        {
            using var stream = dto.ImageFile.OpenReadStream();
            product.Image = await _storageService.UploadFileAsync(stream, dto.ImageFile.FileName, dto.ImageFile.ContentType);
        }
        else if (dto.Image != null)
        {
            product.Image = dto.Image;
        }

        product.ProductName = dto.ProductName;
        product.CategoryId = dto.CategoryId;
        product.BrandId = dto.BrandId;
        product.MinQuantity = dto.MinQuantity;
        product.FaultyQuantity = dto.FaultyQuantity;
        product.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "cái" : dto.Unit;
        product.Price = dto.Price;
        product.Description = dto.Description;
        product.EManualUrl = dto.EManualUrl;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        await _auditService.LogAsync("Cập nhật", "Sản phẩm", product.Id.ToString(), $"Cập nhật sản phẩm: {product.ProductName}", ct);
    }

    public async Task DeleteProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _context.Products
            .Include(p => p.ImportDetails)
            .Include(p => p.ExportDetails)
            .Include(p => p.Repairs)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product == null) throw new ArgumentException("Không tìm thấy sản phẩm.");

        if (product.ImportDetails.Any() || product.ExportDetails.Any() || product.Repairs.Any())
        {
            // Soft delete nếu có dữ liệu liên quan
            product.IsDeleted = true;
            product.DeletedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.Products.Remove(product);
        }

        await _context.SaveChangesAsync(ct);
        await _auditService.LogAsync("Xóa", "Sản phẩm", id.ToString(), $"Xóa sản phẩm: {product.ProductName}", ct);
    }

    public async Task UpdateQuantityAsync(Guid id, int change, CancellationToken ct = default)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        if (product == null) throw new ArgumentException("Không tìm thấy sản phẩm.");

        product.Quantity += change;
        if (product.Quantity < 0) throw new InvalidOperationException("Số lượng tồn kho không thể âm.");

        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<LowStockProductDto>> GetLowStockProductsAsync(CancellationToken ct = default)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => !p.IsDeleted && p.MinQuantity > 0 && p.Quantity <= p.MinQuantity)
            .OrderBy(p => p.Quantity)
            .ToListAsync(ct);

        return products.Select(p => new LowStockProductDto(
            p.Id,
            p.ProductName,
            p.Category?.CategoryName,
            p.Brand?.BrandName,
            p.Quantity,
            p.MinQuantity,
            p.Unit,
            p.Price
        ));
    }

    private async Task<ProductDto> MapToDtoAsync(Product p, int recentUsage = 0)
    {
        var imageUrl = !string.IsNullOrEmpty(p.Image)
            ? await _storageService.GetFileUrlAsync(p.Image)
            : null;

        // Smart Analytics: Forecasting days remaining
        int? daysRemaining = null;
        double consumptionRate = 0;
        
        if (recentUsage > 0)
        {
            consumptionRate = (double)recentUsage / 30.0;
            if (consumptionRate > 0)
            {
                daysRemaining = (int)Math.Floor(p.Quantity / consumptionRate);
            }
        }

        return new ProductDto(
            p.Id,
            p.ProductName,
            p.CategoryId,
            p.Category?.CategoryName,
            p.BrandId,
            p.Brand?.BrandName,
            p.Quantity,
            p.MinQuantity,
            p.Unit,
            p.Price,
            imageUrl ?? p.Image,
            p.Description,
            p.MinQuantity > 0 && p.Quantity <= p.MinQuantity,
            p.FaultyQuantity,
            daysRemaining,
            Math.Round(consumptionRate, 2),
            p.EManualUrl,
            p.CreatedAt,
            p.UpdatedAt
        );
    }
}
