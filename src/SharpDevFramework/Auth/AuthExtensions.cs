using Microsoft.AspNetCore.Http;

namespace SharpDevFramework;

public static class AuthExtensions
{
    public static JwtPayload GetJwtPayload(this HttpContext httpContext)
    {
        var result = httpContext.Items.TryGetValue("payload", out var payload) ? payload as JwtPayload : null;
        return result ?? throw new Exception("JWT payload not found");
    }
}