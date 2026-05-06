using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// JWT 认证过滤器，用于验证请求的 JWT Token
/// </summary>
internal class AuthFilter(TokenService tokenService) : IAuthorizationFilter
{
    /// <summary>
    /// 授权过滤逻辑
    /// </summary>
    /// <param name="context">授权过滤上下文</param>
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // 允许匿名访问的接口直接通过
        if (context.ActionDescriptor.EndpointMetadata.Any(m => m is IAllowAnonymous)) return;

        var path = context.HttpContext.Request.Path.Value ?? string.Empty;
        // 静态文件和 SignalR Hub 不需要认证
        if (path.StartsWith("/wwwroot/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/hub/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/signalr/", StringComparison.OrdinalIgnoreCase)) return;

        // 尝试从请求头获取 Token
        var authHeader = context.HttpContext.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader.IsNullOrWhiteSpace())
        {
            // 尝试从 QueryString 获取 Token
            authHeader = context.HttpContext.Request.Query.TryGetValue("access_token", out var token) ? token : string.Empty;
            if (authHeader.IsNullOrWhiteSpace())
            {
                UnAuthenticated(context);
                return;
            }
        }

        try
        {
            var token = authHeader.TrimStart("Bearer ");
            var payload = tokenService.VerifyToken(token);
            context.HttpContext.Items["payload"] = payload;

            var roles = context.ActionDescriptor.EndpointMetadata.Where(m => m is RoleAttribute).SelectMany(m => (m as RoleAttribute)!.Roles);
            if (roles.Any())
            {
                var currentRoles = payload.Role.SplitToList();
                if ((from a in roles join b in currentRoles on a equals b select 1).IsNullOrEmpty())
                {
                    context.Result = new StatusCodeResult(StatusCodes.Status403Forbidden);
                    return;
                }
            }
        }
        catch
        {
            UnAuthenticated(context);
            return;
        }
    }

    /// <summary>
    /// 设置未授权响应
    /// </summary>
    /// <param name="context">授权过滤上下文</param>
    static void UnAuthenticated(AuthorizationFilterContext context)
    {
        context.Result = new StatusCodeResult(StatusCodes.Status401Unauthorized);
    }
}