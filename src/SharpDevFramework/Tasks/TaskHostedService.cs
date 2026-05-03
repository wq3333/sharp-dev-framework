using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SharpDevLib;
using System.Reflection;

namespace SharpDevFramework;

/// <summary>
/// 任务托管服务，后台运行的任务中心
/// </summary>
public class TaskHostedService(TaskCenter taskCenter, IServiceProvider serviceProvider, IConfiguration configuration, ILogger<TaskHostedService> logger) : BackgroundService
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

        // 启动定时数据清理任务
        var dataCleanupEnabled = configuration.GetValue<bool>("FrameworkSettings:DataCleanup:IsEnabled");
        if (dataCleanupEnabled)
        {
            _ = RunDataCleanupSchedulerAsync(stoppingToken);
        }
    }

    /// <summary>
    /// 运行数据清理任务调度器
    /// </summary>
    async Task RunDataCleanupSchedulerAsync(CancellationToken stoppingToken)
    {
        var cleanupTimeStr = configuration.GetValue<string>("FrameworkSettings:DataCleanup:CleanupTime") ?? "02:00";
        if (!TimeOnly.TryParse(cleanupTimeStr, out var cleanupTime))
        {
            cleanupTime = new TimeOnly(2, 0);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = now.Date.AddHours(cleanupTime.Hour).AddMinutes(cleanupTime.Minute);
            if (nextRun <= now)
            {
                nextRun = nextRun.AddDays(1);
            }

            var delay = nextRun - now;
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("下一次数据清理将在 {NextRun} 执行（等待 {Delay}）", nextRun, delay);
            }

            await Task.Delay(delay, stoppingToken);

            if (stoppingToken.IsCancellationRequested) break;

            try
            {
                var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<FrameworkDbContext>();

                var taskEntity = new TaskEntity
                {
                    Type = FrameworkTaskTypes.DataCleanup,
                    Status = TaskStates.Pending
                };
                dbContext.Tasks.Add(taskEntity);
                await dbContext.SaveChangesAsync(stoppingToken);
                await taskCenter.PublishAsync(taskEntity.Id);

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("已发布数据清理任务");
                }
            }
            catch (Exception ex)
            {
                if (logger.IsEnabled(LogLevel.Error))
                {
                    logger.LogError(ex, "发布数据清理任务失败");
                }
            }
        }
    }
}