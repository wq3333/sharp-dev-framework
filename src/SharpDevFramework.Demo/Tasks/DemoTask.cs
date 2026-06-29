using SharpDevFramework.Demo.Enums;

namespace SharpDevFramework.Demo.Tasks;

[TaskRegister(nameof(TaskTypes.Demo))]
//[TaskSequential]
public class DemoTask(IServiceProvider serviceProvider) : BaseTask(serviceProvider)
{
    protected override async Task ProcessAsync(int id, CancellationToken cancellationToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(1), cancellationToken);
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("demotask processed with id:{id}", id);
        await Task.CompletedTask;
    }
}
