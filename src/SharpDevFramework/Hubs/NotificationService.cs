using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;

namespace SharpDevFramework;

/// <summary>
/// 通知服务，用于向客户端推送实时通知
/// </summary>
internal class NotificationService(IServiceProvider serviceProvider) : ISingletonService
{
    /// <summary>
    /// 广播任务更新消息
    /// </summary>
    /// <param name="task">任务实体</param>
    public async Task BroadcastTaskUpdatedAsync(TaskEntity task)
    {
        await BroadcastAsync("TaskUpdated", task);
    }

    /// <summary>
    /// 广播消息到所有客户端
    /// </summary>
    /// <param name="messageType">消息类型</param>
    /// <param name="data">消息数据</param>
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
