using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Brand;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BrandsController : ControllerBase
{
    private readonly IBrandService _brandService;

    public BrandsController(IBrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Brands.View)]
    public async Task<ActionResult<IEnumerable<BrandDto>>> GetBrands(CancellationToken ct)
    {
        var items = await _brandService.GetBrandsAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Brands.View)]
    public async Task<ActionResult<BrandDto>> GetBrand(Guid id, CancellationToken ct)
    {
        var brand = await _brandService.GetBrandByIdAsync(id, ct);
        if (brand == null) return NotFound();
        return Ok(brand);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Brands.Create)]
    public async Task<ActionResult<BrandDto>> CreateBrand([FromBody] CreateBrandDto dto, CancellationToken ct)
    {
        var brand = await _brandService.CreateBrandAsync(dto, ct);
        return CreatedAtAction(nameof(GetBrand), new { id = brand.Id }, brand);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Brands.Edit)]
    public async Task<IActionResult> UpdateBrand(Guid id, [FromBody] UpdateBrandDto dto, CancellationToken ct)
    {
        await _brandService.UpdateBrandAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Brands.Delete)]
    public async Task<IActionResult> DeleteBrand(Guid id, CancellationToken ct)
    {
        await _brandService.DeleteBrandAsync(id, ct);
        return NoContent();
    }
}
