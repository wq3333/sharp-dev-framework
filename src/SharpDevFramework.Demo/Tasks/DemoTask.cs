

using SharpDevFramework.Demo.Data;
using SharpDevFramework.Demo.Enums;

namespace SharpDevFramework.Demo.Tasks;

[TaskRegister(nameof(TaskTypes.Demo))]
public class DemoTask(IServiceProvider serviceProvider) : BaseTask(serviceProvider), IScopedService
{
    protected override async Task ProcessAsync(int id, CancellationToken cancellationToken)
    {
        throw new Exception("some error");
        await Task.Delay(TimeSpan.FromMinutes(10),cancellationToken);
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("demotask processed with id:{id}", id);
        await Task.CompletedTask;
    }
}
