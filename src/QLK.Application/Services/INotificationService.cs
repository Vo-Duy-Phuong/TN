using QLK.Application.DTOs.Notifications;

namespace QLK.Application.Services;

public interface INotificationService
{
    Task<NotificationDto> CreateAndSendAsync(CreateNotificationDto dto, CancellationToken ct = default);
    Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 20, CancellationToken ct = default);
    Task<NotificationSummaryDto> GetNotificationSummaryAsync(Guid userId, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);
    Task DeleteNotificationAsync(Guid notificationId, Guid userId, CancellationToken ct = default);
    Task<List<NotificationDto>> GetAllNotificationsAsync(int limit = 100, CancellationToken ct = default);
    Task AdminDeleteAsync(Guid notificationId, CancellationToken ct = default);
}
