using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;

namespace SharpDevFramework;

public class NotificationService(IServiceProvider serviceProvider) : ISingletonService
{
    public async Task BroadcastTaskUpdatedAsync(TaskEntity task)
    {
        await BroadcastAsync("TaskUpdated", task);
    }

    async Task BroadcastAsync(string messageType, object? data)
    {
        await serviceProvider
            .CreateScope()
            .ServiceProvider
            .GetRequiredService<IHubContext<NotificationHub>>()
            .Clients
            .All
            .SendAsync(messageType, data);
    }
}
