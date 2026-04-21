using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Notifications;
using QLK.Application.Services;
using QLK.Domain.Constants;
using System.Security.Claims;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Notifications.View)]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMyNotifications([FromQuery] int limit = 20, CancellationToken ct = default)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var notifications = await _notificationService.GetUserNotificationsAsync(userId, limit, ct);
        return Ok(notifications);
    }

    [HttpGet("summary")]
    [Authorize(CustomPermissions.Notifications.View)]
    public async Task<ActionResult<NotificationSummaryDto>> GetSummary(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var summary = await _notificationService.GetNotificationSummaryAsync(userId, ct);
        return Ok(summary);
    }

    [HttpPost("{id}/read")]
    [Authorize]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        await _notificationService.MarkAsReadAsync(id, userId, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    [Authorize]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(userId, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Notifications.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        await _notificationService.DeleteNotificationAsync(id, userId, ct);
        return NoContent();
    }

    [HttpPost("test")]
    [Authorize]
    public async Task<IActionResult> SendTest(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        await _notificationService.CreateAndSendAsync(new CreateNotificationDto(
            userId,
            "Thông báo thử nghiệm",
            "Hệ thống thông báo của bạn đã hoạt động chính xác! 🚀",
            QLK.Domain.Enums.NotificationType.Info
        ), ct);

        return Ok(new { message = "Test notification sent" });
    }
}
