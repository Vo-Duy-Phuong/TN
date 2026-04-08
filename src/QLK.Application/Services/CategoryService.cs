using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Category;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<CategoryDto?> GetCategoryByIdAsync(Guid id, CancellationToken ct = default);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken ct = default);
    Task UpdateCategoryAsync(Guid id, UpdateCategoryDto dto, CancellationToken ct = default);
    Task DeleteCategoryAsync(Guid id, CancellationToken ct = default);
}

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;

    public CategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var cats = await _context.Categories
            .OrderBy(c => c.CategoryName)
            .ToListAsync(ct);
        return cats.Select(MapToDto);
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(Guid id, CancellationToken ct = default)
    {
        var cat = await _context.Categories.FindAsync(new object[] { id }, ct);
        return cat == null ? null : MapToDto(cat);
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken ct = default)
    {
        var cat = new Category
        {
            Id = Guid.NewGuid(),
            CategoryName = dto.CategoryName,
            Description = dto.Description
        };
        await _context.Categories.AddAsync(cat, ct);
        await _context.SaveChangesAsync(ct);
        return MapToDto(cat);
    }

    public async Task UpdateCategoryAsync(Guid id, UpdateCategoryDto dto, CancellationToken ct = default)
    {
        var cat = await _context.Categories.FindAsync(new object[] { id }, ct);
        if (cat == null) throw new ArgumentException("Không tìm thấy danh mục.");

        cat.CategoryName = dto.CategoryName;
        cat.Description = dto.Description;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken ct = default)
    {
        var cat = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (cat == null) throw new ArgumentException("Không tìm thấy danh mục.");
        if (cat.Products.Any()) throw new InvalidOperationException("Không thể xóa danh mục đang có sản phẩm.");

        _context.Categories.Remove(cat);
        await _context.SaveChangesAsync(ct);
    }

    private static CategoryDto MapToDto(Category c) => new CategoryDto(c.Id, c.CategoryName, c.Description);
}
