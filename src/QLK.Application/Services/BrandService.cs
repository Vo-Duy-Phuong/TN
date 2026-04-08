using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Brand;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IBrandService
{
    Task<IEnumerable<BrandDto>> GetBrandsAsync(CancellationToken ct = default);
    Task<BrandDto?> GetBrandByIdAsync(Guid id, CancellationToken ct = default);
    Task<BrandDto> CreateBrandAsync(CreateBrandDto dto, CancellationToken ct = default);
    Task UpdateBrandAsync(Guid id, UpdateBrandDto dto, CancellationToken ct = default);
    Task DeleteBrandAsync(Guid id, CancellationToken ct = default);
}

public class BrandService : IBrandService
{
    private readonly ApplicationDbContext _context;

    public BrandService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BrandDto>> GetBrandsAsync(CancellationToken ct = default)
    {
        var brands = await _context.Brands
            .OrderBy(b => b.BrandName)
            .ToListAsync(ct);
        return brands.Select(MapToDto);
    }

    public async Task<BrandDto?> GetBrandByIdAsync(Guid id, CancellationToken ct = default)
    {
        var brand = await _context.Brands.FindAsync(new object[] { id }, ct);
        return brand == null ? null : MapToDto(brand);
    }

    public async Task<BrandDto> CreateBrandAsync(CreateBrandDto dto, CancellationToken ct = default)
    {
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            BrandName = dto.BrandName,
            Logo = dto.Logo
        };
        await _context.Brands.AddAsync(brand, ct);
        await _context.SaveChangesAsync(ct);
        return MapToDto(brand);
    }

    public async Task UpdateBrandAsync(Guid id, UpdateBrandDto dto, CancellationToken ct = default)
    {
        var brand = await _context.Brands.FindAsync(new object[] { id }, ct);
        if (brand == null) throw new ArgumentException("Không tìm thấy thương hiệu.");

        brand.BrandName = dto.BrandName;
        brand.Logo = dto.Logo;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteBrandAsync(Guid id, CancellationToken ct = default)
    {
        var brand = await _context.Brands
            .Include(b => b.Products)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        if (brand == null) throw new ArgumentException("Không tìm thấy thương hiệu.");
        if (brand.Products.Any()) throw new InvalidOperationException("Không thể xóa thương hiệu đang có sản phẩm.");

        _context.Brands.Remove(brand);
        await _context.SaveChangesAsync(ct);
    }

    private static BrandDto MapToDto(Brand b) => new BrandDto(b.Id, b.BrandName, b.Logo);
}
