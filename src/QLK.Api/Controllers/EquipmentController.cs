using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.Services;
using QLK.Domain.Entities;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
    private readonly IIndividualEquipmentService _equipmentService;

    public EquipmentController(IIndividualEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    /// <summary>
    /// Tra cứu thiết bị công khai theo Serial hoặc MAC (Dành cho khách hàng)
    /// </summary>
    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<IActionResult> Lookup([FromQuery] string query, CancellationToken ct)
    {
        var result = await _equipmentService.LookupBySerialOrMacAsync(query, ct);
        if (result == null) return NotFound(new { message = "Không tìm thấy thiết bị với mã Serial/MAC này." });
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách thiết bị cá thể theo sản phẩm (Dành cho Admin/Quản lý)
    /// </summary>
    [HttpGet("product/{productId}")]
    [Authorize]
    public async Task<IActionResult> GetByProduct(Guid productId, [FromQuery] Guid? warehouseId, [FromQuery] EquipmentStatus? status, CancellationToken ct)
    {
        var result = await _equipmentService.GetByProductAsync(productId, warehouseId, status, ct);
        return Ok(result);
    }
}
