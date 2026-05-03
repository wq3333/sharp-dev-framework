using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SharpDevFramework;

/// <summary>
/// 后台任务基类，继承此类实现具体任务逻辑
/// </summary>
public abstract class BaseTask:IScopedService
{
    /// <summary>
    /// 服务提供器
    /// </summary>
    protected readonly IServiceProvider _serviceProvider;

    /// <summary>
    /// 日志记录器
    /// </summary>
    protected readonly ILogger _logger;

    /// <summary>
    /// 数据库上下文
    /// </summary>
    protected readonly FrameworkDbContext _dbContext;

    /// <summary>
    /// 任务中心
    /// </summary>
    protected readonly TaskCenter _taskCenter;

    /// <summary>
    /// 通知服务
    /// </summary>
    protected readonly NotificationService _notificationService;

    /// <summary>
    /// 服务作用域
    /// </summary>
    protected readonly IServiceScope _serviceScope;

    /// <summary>
    /// 构造函数
    /// </summary>
    /// <param name="serviceProvider">服务提供器</param>
    protected BaseTask(IServiceProvider serviceProvider)
    {
        _serviceScope = serviceProvider.CreateScope();
        _serviceProvider = _serviceScope.ServiceProvider;
        _logger = _serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(GetType());
        _dbContext = _serviceProvider.GetRequiredService<FrameworkDbContext>();
        _taskCenter = _serviceProvider.GetRequiredService<TaskCenter>();
        _notificationService = _serviceProvider.GetRequiredService<NotificationService>();
    }

    /// <summary>
    /// 处理任务
    /// </summary>
    /// <param name="taskId">任务 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    public async Task HandleAsync(int taskId, CancellationToken cancellationToken)
    {
        var task = _dbContext.Tasks.Find(taskId) ?? throw new Exception($"task not found with id:{taskId}");
        if (task.Status == TaskStates.Completed) return;

        try
        {
            await _taskCenter.ChangeTaskState(task.Id, TaskStates.Processing);
            await ProcessAsync(taskId, cancellationToken);
            if (AutoComplete) await _taskCenter.ChangeTaskState(task.Id, TaskStates.Completed);
        }
        catch (TaskCanceledException ex)
        {
            await _taskCenter.ChangeTaskState(task.Id, TaskStates.Cancled, ex.Message);
        }
        catch (Exception ex)
        {
            await _taskCenter.ChangeTaskState(task.Id, TaskStates.Failed, ex.Message);
        }
        finally
        {
            _serviceScope.Dispose();
        }
    }

    /// <summary>
    /// 是否自动完成任务，默认为 true
    /// </summary>
    protected virtual bool AutoComplete { get; } = true;

    /// <summary>
    /// 实际的任务处理逻辑，由子类实现
    /// </summary>
    /// <param name="id">任务 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    protected abstract Task ProcessAsync(int id, CancellationToken cancellationToken);
}
