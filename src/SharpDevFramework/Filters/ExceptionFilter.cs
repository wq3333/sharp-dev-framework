using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 全局异常过滤器，统一处理未捕获的异常
/// </summary>
public class ExceptionFilter(IWebHostEnvironment env) : IExceptionFilter
{
    /// <summary>
    /// 异常处理逻辑
    /// </summary>
    /// <param name="context">异常上下文</param>
    public void OnException(ExceptionContext context)
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger<ExceptionFilter>();
        logger.LogError(context.Exception, "处理请求失败:{Message},{Trace}", context.Exception?.Message, context.Exception?.StackTrace);

        if (context.Exception is UnauthorizedAccessException)
        {
            // 权限异常返回 403
            context.HttpContext.Response.StatusCode = 403;
            var errorMessage = env.IsDevelopment()
                ? context.Exception?.InnerException?.Message ?? context.Exception?.Message
                : "服务器处理请求时发生错误";
            context.Result = new JsonResult(EmptyReply.Failed(errorMessage));
        }
        else
        {
            // 其他异常返回 500
            context.HttpContext.Response.StatusCode = 500;
            var errorMessage = env.IsDevelopment()
                ? context.Exception?.InnerException?.Message ?? context.Exception?.Message
                : "服务器处理请求时发生错误";
            context.Result = new JsonResult(EmptyReply.Failed(errorMessage));
        }
    }
}
