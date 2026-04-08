using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Category;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Categories.View)]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories(CancellationToken ct)
    {
        var items = await _categoryService.GetCategoriesAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Categories.View)]
    public async Task<ActionResult<CategoryDto>> GetCategory(Guid id, CancellationToken ct)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id, ct);
        if (category == null) return NotFound();
        return Ok(category);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Categories.Create)]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto dto, CancellationToken ct)
    {
        var category = await _categoryService.CreateCategoryAsync(dto, ct);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Categories.Edit)]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryDto dto, CancellationToken ct)
    {
        await _categoryService.UpdateCategoryAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Categories.Delete)]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct)
    {
        await _categoryService.DeleteCategoryAsync(id, ct);
        return NoContent();
    }
}
