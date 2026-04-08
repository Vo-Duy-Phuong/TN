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
}

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public ProductService(ApplicationDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<(IEnumerable<ProductDto> Items, int TotalCount)> GetProductsAsync(ProductFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(p => p.ProductName.ToLower().Contains(search) || (p.Description != null && p.Description.ToLower().Contains(search)));
        }

        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

        if (filter.BrandId.HasValue)
            query = query.Where(p => p.BrandId == filter.BrandId.Value);

        var totalCount = await query.CountAsync(ct);
        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<ProductDto>();
        foreach (var product in products)
        {
            dtos.Add(await MapToDtoAsync(product));
        }

        return (dtos, totalCount);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return product == null ? null : await MapToDtoAsync(product);
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
            Price = dto.Price,
            Image = image,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Products.AddAsync(product, ct);
        await _context.SaveChangesAsync(ct);

        return await MapToDtoAsync(product);
    }

    public async Task UpdateProductAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        if (product == null) throw new ArgumentException("Không tìm thấy sản phẩm.");

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
        product.Price = dto.Price;
        product.Description = dto.Description;

        await _context.SaveChangesAsync(ct);
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
            throw new InvalidOperationException("Không thể xóa sản phẩm đã có dữ liệu nhập/xuất hoặc sửa chữa.");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateQuantityAsync(Guid id, int change, CancellationToken ct = default)
    {
        var product = await _context.Products.FindAsync(new object[] { id }, ct);
        if (product == null) throw new ArgumentException("Không tìm thấy sản phẩm.");

        product.Quantity += change;
        if (product.Quantity < 0) throw new InvalidOperationException("Số lượng tồn kho không thể âm.");

        await _context.SaveChangesAsync(ct);
    }

    private async Task<ProductDto> MapToDtoAsync(Product p)
    {
        var imageUrl = !string.IsNullOrEmpty(p.Image) 
            ? await _storageService.GetFileUrlAsync(p.Image) 
            : null;

        return new ProductDto(
            p.Id,
            p.ProductName,
            p.CategoryId,
            p.Category?.CategoryName,
            p.BrandId,
            p.Brand?.BrandName,
            p.Quantity,
            p.Price,
            imageUrl ?? p.Image,
            p.Description,
            p.CreatedAt
        );
    }
}
