using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SharpDevLib;
using System.Reflection;

namespace SharpDevFramework;

/// <summary>
/// 任务托管服务，后台运行的任务中心
/// </summary>
public class TaskHostedService(TaskCenter taskCenter, IServiceProvider serviceProvider, IConfiguration configuration) : BackgroundService
{
    /// <summary>
    /// 需要扫描的程序集
    /// </summary>
    internal static Assembly[] Assemblies { get; set; } = [];

    /// <summary>
    /// 执行后台任务
    /// </summary>
    /// <param name="stoppingToken">停止令牌</param>
    /// <returns>Task</returns>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await taskCenter.StartAsync(Assemblies, stoppingToken);
        // 重启未完成的任务
        var maxRetryCount = configuration.GetValue<int>("FrameworkSettings:Tasks:MaxRetryCount");
        var notFinishedTasks = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<FrameworkDbContext>().Tasks.Where(t => (t.Status != TaskStates.Completed && t.Status != TaskStates.Cancled) && t.RetryCount < maxRetryCount).ToList();
        foreach (var item in notFinishedTasks)
        {
            await taskCenter.PublishAsync(item.Id);
        }
    }
}