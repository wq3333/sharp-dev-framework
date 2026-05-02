using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SharpDevLib;
using System.Reflection;
using System.Threading.Channels;

namespace SharpDevFramework;

public class TaskCenter(ILogger<TaskCenter> logger, IServiceProvider serviceProvider, IConfiguration configuration, NotificationService notificationService) : ISingletonService
{
    Channel<int>? _channel;
    bool _started;
    Task? _consumerTask;
    CancellationTokenSource? _stoppingTokenSource;
    readonly Dictionary<int, CancellationTokenSource> _cancleTokens = [];
    readonly Dictionary<string, Type> _handlerTypes = [];

    public async Task PublishAsync(int taskId)
    {
        if (!_started || _channel is null) throw new Exception($"{nameof(TaskCenter)} not started");
        await _channel.Writer.WriteAsync(taskId);
    }

    public Task StartAsync(Assembly[] assemblies, CancellationToken cancellationToken)
    {
        if (_started) throw new InvalidOperationException($"{nameof(TaskCenter)} already started");
        _started = true;
        RegisterHandlerTypes(assemblies);
        cancellationToken.Register(async () => await StopAsync());
        _channel = Channel.CreateUnbounded<int>();
        _stoppingTokenSource = new CancellationTokenSource();
        _consumerTask = RunConsumerAsync(_stoppingTokenSource.Token);
        if (logger.IsEnabled(LogLevel.Information)) logger.LogInformation("{TaskCenter} started", nameof(TaskCenter));
        return Task.CompletedTask;
    }

    void RegisterHandlerTypes(Assembly[] assemblies)
    {
        assemblies
           .SelectMany(a => a.GetTypes())
           .Distinct()
           .Where(t => t.IsClass && !t.IsAbstract && typeof(BaseTask).IsAssignableFrom(t))
           .ForEach(x =>
           {
               var attribute = x.GetCustomAttribute<TaskRegisterAttribute>();
               if (attribute is null)
               {
                   if (logger.IsEnabled(LogLevel.Warning)) logger.LogWarning("type '{Type}' missing TaskRegisterAttribute", x.FullName);
                   return;
               }
               if (_handlerTypes.TryGetValue(attribute.Type, out _)) throw new Exception($"Task type '{attribute.Type}' is already registered");
               _handlerTypes[attribute.Type] = x;
           });
    }

    async Task RunConsumerAsync(CancellationToken stoppingToken)
    {
        try
        {
            var maxProcessCount = configuration.GetValue<int>("FrameworkSettings:Tasks:MaxProcessCount");
            var semaphore = new SemaphoreSlim(maxProcessCount, maxProcessCount);
            await foreach (var taskId in _channel!.Reader.ReadAllAsync(stoppingToken))
            {
                await semaphore.WaitAsync(stoppingToken);
                _ = ProcessSingleTask(taskId, semaphore).ContinueWith(t =>
                {
                    if (t.IsFaulted)
                    {
                        logger.LogError(t.Exception, "Task processing failed with unobserved exception");
                    }
                }, TaskContinuationOptions.OnlyOnFaulted);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Task consumer stopped");
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Task consumer fatal error");
        }
    }

    public async Task CancelTaskAsync(int taskId)
    {
        if (_cancleTokens.TryGetValue(taskId, out var cts)) await cts.CancelAsync();
    }

    public async Task StopAsync()
    {
        if (!_started) return;
        _stoppingTokenSource?.Cancel();
        _channel?.Writer.Complete();
        if (_consumerTask != null) await _consumerTask.WaitAsync(TimeSpan.FromSeconds(5));
        _channel = null;
        _started = false;
        foreach (var item in _cancleTokens)
        {
            await item.Value.CancelAsync();
        }
        _stoppingTokenSource?.Dispose();
        if (logger.IsEnabled(LogLevel.Information)) logger.LogInformation("{TaskCenter} stopped", nameof(TaskCenter));
    }

    async Task ProcessSingleTask(int taskId, SemaphoreSlim semaphore)
    {
        try
        {
            var dbContext = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<FrameworkDbContext>();
            var task = dbContext.Tasks.Find(taskId);
            if (task is null) return;

            if (!_handlerTypes.TryGetValue(task.Type, out var handlerType))
            {
                if (logger.IsEnabled(LogLevel.Warning)) logger.LogWarning("{Message} ignored", task.Type);
                return;
            }
            var handler = serviceProvider.CreateScope().ServiceProvider.GetRequiredService(handlerType) as BaseTask ?? throw new Exception($"Task type '{handlerType.FullName}' must inherit from {nameof(BaseTask)}");
            _cancleTokens[taskId] = new CancellationTokenSource();
            await handler.HandleAsync(taskId, _cancleTokens[taskId].Token);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error)) logger.LogError("Task error: {Message}", ex.Message);
        }
        finally
        {
            _cancleTokens.Remove(taskId);
            semaphore.Release();
        }
    }

    public async Task ChangeTaskState(int taskId, TaskStates state, string? error = null)
    {
        var dbContext = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<FrameworkDbContext>();
        var task = dbContext.Tasks.Find(taskId);
        if (task is null) return;
        if (task.Status == TaskStates.Completed) return;

        task.Status = state;
        task.UpdatedAt = DateTime.Now.ToUtcTimestamp();
        if (error.NotNullOrWhiteSpace()) task.ErrorMessage = error;
        if (state == TaskStates.Completed) task.ErrorMessage = null;
        dbContext.Tasks.Update(task);
        dbContext.SaveChanges();

        await notificationService.BroadcastTaskUpdatedAsync(task);
        if (logger.IsEnabled(LogLevel.Information)) logger.LogInformation("{TaskType} task {TaskId} {TaskState}", task.Type, task.Id, task.Status);

        if (task.Status == TaskStates.Failed)
        {
            var maxRetryCount = configuration.GetValue<int>("FrameworkSettings:Tasks:MaxRetryCount");
            if (task.RetryCount < maxRetryCount)
            {
                task.RetryCount += 1;
                dbContext.Tasks.Update(task);
                dbContext.SaveChanges();
                await PublishAsync(task.Id);
                if (logger.IsEnabled(LogLevel.Warning)) logger.LogWarning("Process {TaskType} task {TaskId} Failed, retrying... (RetryCount: {RetryCount})", task.Type, task.Id, task.RetryCount);
            }
            else
            {
                if (logger.IsEnabled(LogLevel.Error)) logger.LogError("Process {TaskType} task {TaskId} Failed after maximum retries", task.Type, task.Id);
            }
        }
    }
}