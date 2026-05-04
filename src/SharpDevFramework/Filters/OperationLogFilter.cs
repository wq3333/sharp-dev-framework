using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 操作日志过滤器，记录用户操作并发布到后台任务
/// </summary>
internal class OperationLogFilter : IAsyncActionFilter
{
    static readonly string[] _ignoredQueryPath = ["/api/tasks", "/api/useroperationlogs"];

    /// <summary>
    /// 执行过滤器逻辑
    /// </summary>
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.HttpContext.Request.Method == "GET" && _ignoredQueryPath.Contains(context.HttpContext.Request.Path.Value ?? string.Empty))
        {
            await next();
            return;
        }

        var startTime = DateTime.Now;
        var httpContext = context.HttpContext;
        var userId = 0;
        var userName = string.Empty;

        if (httpContext.Items["payload"] is JwtPayload payload)
        {
            userId = payload.UserId;
            userName = payload.Username;
        }

        var routePath = httpContext.Request.Path.Value ?? string.Empty;
        var httpMethod = httpContext.Request.Method;
        var controllerName = context.ActionDescriptor.RouteValues["controller"] ?? string.Empty;
        var actionName = context.ActionDescriptor.RouteValues["action"] ?? string.Empty;
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        var userAgent = httpContext.Request.Headers.UserAgent.FirstOrDefault() ?? string.Empty;
        var operationType = GetOperationType(httpMethod, actionName);

        var requestData = context.ActionArguments.TrySerialize(out var data) ? data : null;
        var resultContext = await next();
        var durationMs = (long)(DateTime.Now - startTime).TotalMilliseconds;

        var responseData = string.Empty;
        var isSuccess = !resultContext.ExceptionHandled && resultContext.Exception == null;
        var errorMessage = resultContext.Exception?.Message ?? string.Empty;
        if (resultContext.Result is Microsoft.AspNetCore.Mvc.ObjectResult objectResult) responseData = objectResult.Value!.TrySerialize(out var o) ? o : null;

        var logData = new UserOperationLogEntity
        {
            UserId = userId,
            UserName = userName,
            OperationType = operationType,
            ControllerName = controllerName,
            ActionName = actionName,
            RoutePath = routePath,
            HttpMethod = httpMethod,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            RequestData = requestData,
            ResponseData = responseData,
            DurationMs = durationMs,
            IsSuccess = isSuccess,
            ErrorMessage = errorMessage
        };
        OperationLogHostedService.Push(logData);
    }

    /// <summary>
    /// 根据HTTP方法和动作名称推断操作类型
    /// </summary>
    static string GetOperationType(string httpMethod, string actionName)
    {
        return httpMethod.ToUpper() switch
        {
            "POST" => "Create",
            "PUT" => "Update",
            "DELETE" => "Delete",
            "GET" => "Query",
            _ => actionName
        };
    }
}

internal class OperationLogHostedService(IServiceProvider serviceProvider, ILogger<OperationLogHostedService> logger) : BackgroundService
{
    static readonly List<UserOperationLogEntity> _cache = [];
    static readonly Lock _lock = new();
    static bool _isRunning = false;

    public static void Push(UserOperationLogEntity entity)
    {
        lock (_lock)
        {
            _cache.Add(entity);
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timer = new System.Timers.Timer
        {
            Interval = TimeSpan.FromMinutes(2).TotalMilliseconds
        };
        timer.Elapsed += (_, _) =>
        {
            try
            {
                if (_isRunning) return;
                _isRunning = true;
                using var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<FrameworkDbContext>();
                lock (_lock)
                {
                    dbContext.UserOperationLogs.AddRange(_cache);
                    dbContext.SaveChanges();
                    _cache.Clear();
                }
            }
            catch (Exception ex)
            {
                if (logger.IsEnabled(LogLevel.Warning)) logger.LogWarning("save operation logs failed:{Message}", ex.Message);
            }
            finally
            {
                _isRunning = false;
            }
        };
        timer.Start();
        await Task.CompletedTask;
    }
}
