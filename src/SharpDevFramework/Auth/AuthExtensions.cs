using Microsoft.AspNetCore.Http;

namespace SharpDevFramework;

/// <summary>
/// 认证相关扩展方法
/// </summary>
public static class AuthExtensions
{
    /// <summary>
    /// 从 HttpContext 中获取 JWT 负载信息
    /// </summary>
    /// <param name="httpContext">HTTP 上下文</param>
    /// <returns>JWT 负载对象</returns>
    /// <exception cref="Exception">当负载不存在时抛出异常</exception>
    public static JwtPayload GetJwtPayload(this HttpContext httpContext)
    {
        var result = httpContext.Items.TryGetValue("payload", out var payload) ? payload as JwtPayload : null;
        return result ?? throw new Exception("JWT payload not found");
    }
}