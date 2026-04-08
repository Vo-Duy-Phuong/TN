using QLK.Domain.Enums;

namespace QLK.Application.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    Guid UserId,
    string? UserFullName,
    string Title,
    string Message,
    NotificationType Type,
    string? Link,
    Guid? RelatedEntityId,
    string? RelatedEntityType,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt
);

public record CreateNotificationDto(
    Guid UserId,
    string Title,
    string Message,
    NotificationType Type,
    string? Link = null,
    Guid? RelatedEntityId = null,
    string? RelatedEntityType = null
);

public record NotificationSummaryDto(
    int UnreadCount,
    List<NotificationDto> RecentNotifications
);
