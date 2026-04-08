using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Notifications;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationSender _notificationSender;

    public NotificationService(ApplicationDbContext context, INotificationSender notificationSender)
    {
        _context = context;
        _notificationSender = notificationSender;
    }

    public async Task<NotificationDto> CreateAndSendAsync(CreateNotificationDto dto, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            Link = dto.Link,
            RelatedEntityId = dto.RelatedEntityId,
            RelatedEntityType = dto.RelatedEntityType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Notifications.AddAsync(notification, ct);
        await _context.SaveChangesAsync(ct);

        // Send real-time notification
        await _notificationSender.SendToUserAsync(dto.UserId.ToString(), MapToDto(notification));

        return MapToDto(notification);
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 20, CancellationToken ct = default)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);

        return notifications.Select(MapToDto).ToList();
    }

    public async Task<NotificationSummaryDto> GetNotificationSummaryAsync(Guid userId, CancellationToken ct = default)
    {
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);

        var recent = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        return new NotificationSummaryDto(unreadCount, recent.Select(MapToDto).ToList());
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct);

        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteNotificationAsync(Guid notificationId, Guid userId, CancellationToken ct = default)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct);

        if (notification != null)
        {
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<List<NotificationDto>> GetAllNotificationsAsync(int limit = 100, CancellationToken ct = default)
    {
        var notifications = await _context.Notifications
            .Include(n => n.User)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);

        return notifications.Select(MapToDto).ToList();
    }

    public async Task AdminDeleteAsync(Guid notificationId, CancellationToken ct = default)
    {
        var notification = await _context.Notifications.FindAsync(new object[] { notificationId }, ct);
        if (notification != null)
        {
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync(ct);
        }
    }

    private static NotificationDto MapToDto(Notification n) => new NotificationDto(
        n.Id,
        n.UserId,
        n.User?.FullName,
        n.Title,
        n.Message,
        n.Type,
        n.Link,
        n.RelatedEntityId,
        n.RelatedEntityType,
        n.IsRead,
        n.ReadAt,
        n.CreatedAt
    );
}
