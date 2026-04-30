using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SharpDevLib;

namespace SharpDevFramework;

public static class AuthExtensions
{
    public static JwtPayload GetJwtPayload(this HttpContext httpContext)
    {
        var result = httpContext.Items.TryGetValue("payload", out var payload) ? payload as JwtPayload : null;
        return result ?? throw new Exception("JWT payload not found");
    }

    public static WebApplication UseAuth(this WebApplication app)
    {
        var isEnabled = app.Configuration.GetValue<bool>("FrameworkSettings:Auth:IsEnabled");
        if (!isEnabled) return app;
        var loginUrl = app.Configuration.GetValue<string>("FrameworkSettings:Auth:LoginUrl");
        var tokenUrl = app.Configuration.GetValue<string>("FrameworkSettings:Auth:TokenUrl");

        if (loginUrl.NotNullOrWhiteSpace()) app.MapLogin(loginUrl);
        if (tokenUrl.NotNullOrWhiteSpace()) app.MapToken(tokenUrl);
        return app;
    }

    static void MapLogin(this WebApplication app, string url)
    {
        app.MapPost(url, async (httpContext) =>
        {
            var request = await httpContext.Request.ReadFromJsonAsync<LoginRequest>() ?? throw new Exception("request model error");
            var context = httpContext.RequestServices.CreateScope().ServiceProvider.GetRequiredService<FrameworkDbContext>();

            if (request.Username.IsNullOrWhiteSpace()) throw new Exception("username requried");
            if (request.Password.IsNullOrWhiteSpace()) throw new Exception("password requried");

            var user = context.Users.FirstOrDefault(u => u.Name == request.Username) ?? throw new Exception("用户名或密码错误");
            if (!user.IsActive) throw new Exception("账户已禁用");

            var now = DateTime.UtcNow.ToUtcTimestamp();
            if (user.LockoutUntil.HasValue && user.LockoutUntil.Value > now)
            {
                var remainingTime = user.LockoutUntil.Value - now;
                throw new Exception($"账户已锁定，请{remainingTime / 1000:F0}秒后重试");
            }

            var result = new PasswordHasher<UserEntity>().VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                var failedAttemptWindow = app.Configuration.GetValue<int>("FrameworkSettings:Auth:FailedMinutes");
                var lockoutDuration = app.Configuration.GetValue<int>("FrameworkSettings:Auth:LockMinutes");
                var maxFailedAttempts = app.Configuration.GetValue<int>("FrameworkSettings:Auth:MaxFailedCount");
                if (failedAttemptWindow <= 0) failedAttemptWindow = 10;
                if (lockoutDuration <= 0) lockoutDuration = 30;
                if (maxFailedAttempts <= 0) maxFailedAttempts = 10;

                if (user.LastFailedLoginTime.HasValue && (now - user.LastFailedLoginTime.Value) > TimeSpan.FromMinutes(failedAttemptWindow).TotalMilliseconds)
                {
                    user.FailedLoginAttempts = 0;
                }

                user.FailedLoginAttempts++;
                user.LastFailedLoginTime = now;

                if (user.FailedLoginAttempts >= maxFailedAttempts)
                {
                    user.LockoutUntil = DateTime.Now.AddMinutes(lockoutDuration).ToUtcTimestamp();
                }
                context.SaveChanges();
                throw new Exception("用户名或密码错误");
            }

            user.FailedLoginAttempts = 0;
            user.LastFailedLoginTime = null;
            user.LockoutUntil = null;
            user.LastLoginAt = now;
            user.LastLoginIp = httpContext.Connection.RemoteIpAddress?.ToString();
            context.SaveChanges();

            var token = httpContext.RequestServices.GetRequiredService<TokenService>().GenerateToken(user.Id, user.Name, user.Role);
            var reply = DataReply.Succeed(new LoginResponse { Token = token, UserId = user.Id, Username = user.Name!, Role = user.Role });
            httpContext.Response.StatusCode = 200;
            await httpContext.Response.WriteAsJsonAsync(reply);

        }).WithMetadata(new AllowAnonymousAttribute());
    }

    static void MapToken(this WebApplication app, string url)
    {
        app.MapPost(url, async (httpContext) =>
        {
            var payload = httpContext.GetJwtPayload();
            var token = httpContext.RequestServices.GetRequiredService<TokenService>().GenerateToken(payload.Id, payload.Name, payload.Role);
            httpContext.Response.StatusCode = 200;
            await httpContext.Response.WriteAsJsonAsync(DataReply.Succeed(token));
        });
    }
}

public class LoginRequest
{
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class LoginResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}