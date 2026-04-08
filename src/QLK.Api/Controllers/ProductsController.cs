using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Product;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Products.View)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts([FromQuery] ProductFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _productService.GetProductsAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Products.View)]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id, CancellationToken ct)
    {
        var product = await _productService.GetProductByIdAsync(id, ct);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Products.Create)]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromForm] CreateProductDto dto, CancellationToken ct)
    {
        var product = await _productService.CreateProductAsync(dto, ct);
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Products.Edit)]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromForm] UpdateProductDto dto, CancellationToken ct)
    {
        await _productService.UpdateProductAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Products.Delete)]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)
    {
        await _productService.DeleteProductAsync(id, ct);
        return NoContent();
    }
}
