using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 全局异常过滤器，统一处理未捕获的异常
/// </summary>
internal class ExceptionFilter : IExceptionFilter
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
            context.HttpContext.Response.StatusCode = 403;
            context.Result = new JsonResult(EmptyReply.Failed(context.Exception?.InnerException?.Message ?? context.Exception?.Message));
        }
        else
        {
            context.HttpContext.Response.StatusCode = 500;
            context.Result = new JsonResult(EmptyReply.Failed(context.Exception?.InnerException?.Message ?? context.Exception?.Message));
        }
    }
}
