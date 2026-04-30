using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SharpDevLib;

namespace SharpDevFramework;

public class AuthFilter(TokenService tokenService) : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (context.ActionDescriptor.EndpointMetadata.Any(m => m is IAllowAnonymous)) return;

        var path = context.HttpContext.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/wwwroot/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/hub/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/signalr/", StringComparison.OrdinalIgnoreCase)) return;

        var authHeader = context.HttpContext.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader.IsNullOrWhiteSpace())
        {
            authHeader = context.HttpContext.Request.Query.TryGetValue("access_token", out var token) ? token : string.Empty;
            if (authHeader.IsNullOrWhiteSpace())
            {
                UnAuthenticated(context);
                return;
            }
        }

        try
        {
            var token = authHeader["Bearer ".Length..].Trim();
            var payload = tokenService.VerifyToken(token);
            context.HttpContext.Items["payload"] = payload;
        }
        catch
        {
            UnAuthenticated(context);
            return;
        }
    }

    static void UnAuthenticated(AuthorizationFilterContext context)
    {
        context.Result = new StatusCodeResult(StatusCodes.Status401Unauthorized);
    }
}