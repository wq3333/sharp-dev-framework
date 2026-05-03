using System.Text.Json;

namespace SharpDevFramework;

/// <summary>
/// 保存操作日志的后台任务
/// </summary>
[TaskRegister(nameof(FrameworkTaskTypes.OperationLogSave))]
public class OperationLogTask(IServiceProvider serviceProvider) : BaseTask(serviceProvider)
{
    /// <summary>
    /// 处理保存操作日志任务
    /// </summary>
    protected override async Task ProcessAsync(int id, CancellationToken cancellationToken)
    {
        var task = _dbContext.Tasks.Find(id);
        if (task == null || string.IsNullOrWhiteSpace(task.Data)) return;

        var logData = JsonSerializer.Deserialize<UserOperationLogEntity>(task.Data);
        if (logData == null) return;

        _dbContext.UserOperationLogs.Add(logData);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
