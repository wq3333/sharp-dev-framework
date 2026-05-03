using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;
using System.Text.Json;

namespace SharpDevFramework;

/// <summary>
/// 操作日志过滤器，记录用户操作并发布到后台任务
/// </summary>
public class OperationLogFilter(IServiceProvider serviceProvider) : IAsyncActionFilter
{
    static readonly string[] _ignoredQueryPath = ["/api/tasks", "/api/useroperationlogs"];
    static readonly BlockingCollection<UserOperationLogEntity> _cache = [];
    static DateTime _lastWriteTime = DateTime.Now;
    static readonly Lock _lock = new();

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

        var requestData = string.Empty;
        try
        {
            if (context.ActionArguments.Count > 0)
            {
                requestData = JsonSerializer.Serialize(context.ActionArguments);
            }
        }
        catch
        {
            requestData = "无法序列化请求参数";
        }

        var resultContext = await next();
        var durationMs = (long)(DateTime.Now - startTime).TotalMilliseconds;

        var responseData = string.Empty;
        var isSuccess = !resultContext.ExceptionHandled && resultContext.Exception == null;
        var errorMessage = resultContext.Exception?.Message ?? string.Empty;

        try
        {
            if (resultContext.Result is Microsoft.AspNetCore.Mvc.ObjectResult objectResult)
            {
                if (objectResult.Value != null)
                {
                    responseData = JsonSerializer.Serialize(objectResult.Value);
                }
            }
        }
        catch
        {
            responseData = "无法序列化响应数据";
        }


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
        lock (_lock) _cache.Add(logData);
        if ((DateTime.Now - _lastWriteTime) < TimeSpan.FromMinutes(2)) return;

        _ = Task.Run(async () =>
        {
            try
            {
                var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<FrameworkDbContext>();
                var data = _cache.GroupBy(x => new { x.RoutePath, x.HttpMethod, x.UserId, x.RequestData }).Select(x => x.OrderBy(y => y.CreatedAt).Last());
                dbContext.UserOperationLogs.AddRange(data);
                await dbContext.SaveChangesAsync();
                lock (_lock) while (_cache.TryTake(out _)) { };
                _lastWriteTime = DateTime.Now;
            }
            catch
            {
            }
        });
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
