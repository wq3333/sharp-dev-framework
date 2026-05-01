

using SharpDevFramework.Demo.Enums;

namespace SharpDevFramework.Demo.Tasks;

[TaskRegister(nameof(TaskTypes.Demo))]
public class DemoTask(IServiceProvider serviceProvider) : BaseTask(serviceProvider), IScopedService
{
    protected override async Task ProcessAsync(int id, CancellationToken cancellationToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(10),cancellationToken);
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("demotask processed with id:{id}", id);
        await Task.CompletedTask;
    }
}
