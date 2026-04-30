using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SharpDevFramework;

public abstract class BaseTask
{
    protected readonly IServiceProvider _serviceProvider;
    protected readonly ILogger _logger;
    protected readonly FrameworkDbContext _dbContext;
    protected readonly TaskCenter _taskCenter;
    protected readonly NotificationService _notificationService;

    protected BaseTask(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        _serviceProvider = scope.ServiceProvider;
        _logger = _serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(GetType());
        _dbContext = _serviceProvider.GetRequiredService<FrameworkDbContext>();
        _taskCenter = _serviceProvider.GetRequiredService<TaskCenter>();
        _notificationService = _serviceProvider.GetRequiredService<NotificationService>();
    }

    public async Task HandleAsync(TaskData taskData, CancellationToken cancellationToken)
    {
        var task = _dbContext.Tasks.Find(taskData.TaskId) ?? throw new Exception($"task not found with id:{taskData.TaskId}");
        if (task.Status == TaskStates.Completed) return;

        try
        {
            await _taskCenter.ChangeTaskState(task.Id, TaskStates.Processing);
            await ProcessAsync(taskData.TaskId, cancellationToken);
            if (AutoComplete) await _taskCenter.ChangeTaskState(task.Id, TaskStates.Completed);
        }
        catch (Exception ex)
        {
            await _taskCenter.ChangeTaskState(task.Id, TaskStates.Failed, ex.Message);
        }
    }

    protected virtual bool AutoComplete { get; } = true;

    protected abstract Task ProcessAsync(int id, CancellationToken cancellationToken);
}
