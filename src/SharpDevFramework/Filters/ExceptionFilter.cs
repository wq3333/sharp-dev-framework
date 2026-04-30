using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SharpDevLib;

namespace SharpDevFramework;

public class ExceptionFilter(IWebHostEnvironment env) : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger<ExceptionFilter>();
        logger.LogError(context.Exception, "处理请求失败:{Message},{Trace}", context.Exception?.Message, context.Exception?.StackTrace);

        context.HttpContext.Response.StatusCode = 500;
        var errorMessage = env.IsDevelopment()
            ? context.Exception?.InnerException?.Message ?? context.Exception?.Message
            : "服务器处理请求时发生错误";

        context.Result = new JsonResult(EmptyReply.Failed(errorMessage));
    }
}

public class ExceptionEndpointFilter(ILogger<ExceptionEndpointFilter> logger) : IEndpointFilter, IScopedService
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        try
        {
            return await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "处理请求失败:{Message},{Trace}", ex.Message, ex.StackTrace);
            return EmptyReply.Failed(ex.Message);
        }
    }
}
