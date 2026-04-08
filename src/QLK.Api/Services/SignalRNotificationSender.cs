using Microsoft.AspNetCore.SignalR;
using QLK.Api.Hubs;
using QLK.Application.Services;

namespace QLK.Api.Services;

public class SignalRNotificationSender : INotificationSender
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationSender(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(string userId, object notification)
    {
        await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);
    }

    public async Task SendToAllAsync(object notification)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
    }

    public async Task SendToGroupAsync(string groupName, object notification)
    {
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
    }
}
