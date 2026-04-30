using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SharpDevLib;
using System.Reflection;

namespace SharpDevFramework;

public class TaskHostedService(TaskCenter taskCenter, IServiceProvider serviceProvider, IConfiguration configuration) : BackgroundService
{
    internal static Assembly[] Assemblies { get; set; } = [];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await taskCenter.StartAsync(Assemblies, stoppingToken);
        var maxRetryCount = configuration.GetValue<int>("FrameworkSettings:Tasks:MaxRetryCount");
        var notFinishedTasks = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<FrameworkDbContext>().Tasks.Where(t => t.Status != TaskStates.Completed && t.RetryCount < maxRetryCount).ToList();
        foreach (var item in notFinishedTasks)
        {
            await taskCenter.PublishAsync(item.Type, item.Id);
        }
    }
}