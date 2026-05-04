using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using SharpDevLib;
using System.Reflection;

namespace SharpDevFramework;

/// <summary>
/// SharpDevFramework 框架扩展方法集合
/// </summary>
public static class FrameworkExtensions
{
    /// <summary>
    /// 添加 SharpDevFramework 框架服务
    /// </summary>
    /// <typeparam name="TDbContext">数据库上下文类型，必须继承自 FrameworkDbContext</typeparam>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <param name="assemblies">需要扫描的程序集数组</param>
    /// <returns>WebApplicationBuilder 实例，用于链式调用</returns>
    public static WebApplicationBuilder AddSharpDevFramework<TDbContext>(this WebApplicationBuilder builder, Assembly[] assemblies) where TDbContext : FrameworkDbContext
    {
        var assembly = assemblies
            .Concat([typeof(FrameworkExtensions).Assembly])
            .Distinct().ToArray();

        builder.AddSettings()
            .AddSerialog()
            .ConfigSizeLimit()
            .AddCors()
            .AddFilters()
            .AddWindowsService()
            .AddDbContext<TDbContext>()
            .AddServices(assembly)
            .AddSignalR()
            .AddTasks(assembly);
        return builder;
    }

    /// <summary>
    /// 使用 SharpDevFramework 框架中间件
    /// </summary>
    /// <param name="app">WebApplication 实例</param>
    /// <param name="assemblies">需要扫描的程序集数组</param>
    /// <returns>WebApplication 实例，用于链式调用</returns>
    public static WebApplication UseSharpDevFramework(this WebApplication app, Assembly[] assemblies)
    {
        var assembly = assemblies
            .Concat([typeof(FrameworkExtensions).Assembly])
            .Distinct().ToArray();

        app.UseDefaultFiles()
            .UseStaticFiles();

        app.UseCors()
            .UseSignalR()
            .UseEnums(assembly);

        app.MapControllers();
        app.SeedDatabase();
        return app;
    }

    /// <summary>
    /// 添加配置文件，支持 appsettings.json、appsettings.local.json、framework.json、framework.local.json
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddSettings(this WebApplicationBuilder builder)
    {
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("appsettings.json"), optional: false, reloadOnChange: true);
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("appsettings.local.json"), optional: true, reloadOnChange: true);
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("framework.json"), optional: true, reloadOnChange: true);
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("framework.local.json"), optional: true, reloadOnChange: true);
        return builder;
    }

    /// <summary>
    /// 配置 Serilog 日志
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddSerialog(this WebApplicationBuilder builder)
    {
        var isEnabled = builder.Configuration.GetValue<bool>("Serilog:IsEnabled");
        if (!isEnabled) return builder;
        Environment.SetEnvironmentVariable("Serilog:WriteTo:0:Args:path", SharpFrameworkStatics.LogsPath);
        builder.Configuration.AddEnvironmentVariables();
        builder.Host.UseSerilog((context, services, configuration) => configuration.ReadFrom.Configuration(context.Configuration));
        return builder;
    }

    /// <summary>
    /// 配置请求大小限制
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder ConfigSizeLimit(this WebApplicationBuilder builder)
    {
        var maxSize = builder.Configuration.GetValue<long>("FrameworkSettings:RequestSizeLimit");
        if (maxSize <= 0) maxSize = long.MaxValue;
        builder.WebHost.ConfigureKestrel(serverOptions => serverOptions.Limits.MaxRequestBodySize = maxSize);
        builder.Services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = maxSize;
            options.ValueLengthLimit = (int)Math.Min(maxSize, int.MaxValue);
        });
        return builder;
    }

    /// <summary>
    /// 配置 CORS 跨域策略
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddCors(this WebApplicationBuilder builder)
    {
        var isEnabled = builder.Configuration.GetValue<bool>("FrameworkSettings:Cors:IsEnabled");
        var policyName = builder.Configuration.GetValue<string>("FrameworkSettings:Cors:PolicyName") ?? "DefaultCorsPolicy";
        if (!isEnabled) return builder;

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(policyName, policy =>
            {
                policy
                    .WithOrigins(builder.Configuration.GetValue<string[]>("FrameworkSettings:Cors:Origins") ?? [])
                    .WithMethods(builder.Configuration.GetValue<string[]>("FrameworkSettings:Cors:Methods") ?? [])
                    .WithHeaders(builder.Configuration.GetValue<string[]>("FrameworkSettings:Cors:Headers") ?? []);

                if (builder.Configuration.GetValue<bool>("FrameworkSettings:Cors:AllowCredentials")) policy.AllowCredentials();
                else policy.DisallowCredentials();

                if (builder.Configuration.GetValue<string[]>("FrameworkSettings:Cors:ExposedHeaders") is { Length: > 0 } exposedHeaders)
                    policy.WithExposedHeaders(exposedHeaders);

                if (builder.Configuration.GetValue<int?>("FrameworkSettings:Cors:MaxAge") is { } maxAge)
                    policy.SetPreflightMaxAge(TimeSpan.FromSeconds(maxAge));
            });
        });
        return builder;
    }

    /// <summary>
    /// 添加过滤器（认证过滤器、异常过滤器）
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddFilters(this WebApplicationBuilder builder)
    {
        var useAuthFilter = builder.Configuration.GetValue<bool>("FrameworkSettings:Auth:IsEnabled");
        var useExceptionFilter = builder.Configuration.GetValue<bool>("FrameworkSettings:UseExceptionFilter");
        var useOperationLogFilter = builder.Configuration.GetValue<bool>("FrameworkSettings:OperationLog:IsEnabled");

        builder.Services.AddControllers(options =>
        {
            if (useAuthFilter)
            {
                if (!File.Exists(SharpFrameworkStatics.JwtSecretPath)) File.WriteAllText(SharpFrameworkStatics.JwtSecretPath, RandomHelper.GenerateCode(RandomType.Mix, 255));
                options.Filters.Add<AuthFilter>();
            }
            if (useExceptionFilter) options.Filters.Add<ExceptionFilter>();
            if (useOperationLogFilter) options.Filters.Add<OperationLogFilter>();
        });
        if (useOperationLogFilter) builder.Services.AddHostedService<OperationLogHostedService>();

        return builder;
    }

    /// <summary>
    /// 添加 Windows Service 支持
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddWindowsService(this WebApplicationBuilder builder)
    {
        var useWindowsService = builder.Configuration.GetValue<bool>("FrameworkSettings:UseWindowsService");
        if (!useWindowsService) return builder;
        builder.Host.UseWindowsService();
        return builder;
    }

    /// <summary>
    /// 添加数据库上下文
    /// </summary>
    /// <typeparam name="TDbContext">数据库上下文类型</typeparam>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddDbContext<TDbContext>(this WebApplicationBuilder builder) where TDbContext : FrameworkDbContext
    {
        builder.Services.AddDbContext<TDbContext>(options => options.UseSqlite($"Data Source={SharpFrameworkStatics.DatabasePath}"));
        builder.Services.AddScoped<FrameworkDbContext, TDbContext>();
        return builder;
    }

    /// <summary>
    /// 添加服务注册（单例、作用域、瞬态）
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <param name="assemblies">需要扫描的程序集数组</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddServices(this WebApplicationBuilder builder, Assembly[] assemblies)
    {
        builder.Services.AddImplementationsOf(assemblies);
        builder.Services.AddHttpClient();
        builder.Services.AddHttpContextAccessor();
        return builder;
    }

    /// <summary>
    /// 添加 SignalR 实时通信服务
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddSignalR(this WebApplicationBuilder builder)
    {
        var useSignalR = builder.Configuration.GetValue<bool>("FrameworkSettings:UseSignalR");
        if (!useSignalR) return builder;
        builder.Services.AddSignalR();
        return builder;
    }

    /// <summary>
    /// 添加后台任务服务
    /// </summary>
    /// <param name="builder">WebApplicationBuilder 实例</param>
    /// <param name="assemblies">需要扫描的程序集数组</param>
    /// <returns>WebApplicationBuilder 实例</returns>
    static WebApplicationBuilder AddTasks(this WebApplicationBuilder builder, Assembly[] assemblies)
    {
        var isEnabled = builder.Configuration.GetValue<bool>("FrameworkSettings:Tasks:IsEnabled");
        if (!isEnabled) return builder;
        TaskHostedService.Assemblies = assemblies;
        builder.Services.AddHostedService<TaskHostedService>();
        return builder;
    }

    /// <summary>
    /// 使用 CORS 跨域中间件
    /// </summary>
    /// <param name="app">WebApplication 实例</param>
    /// <returns>WebApplication 实例</returns>
    static WebApplication UseCors(this WebApplication app)
    {
        var isEnabled = app.Configuration.GetValue<bool>("FrameworkSettings:Cors:IsEnabled");
        var policyName = app.Configuration.GetValue<string>("FrameworkSettings:Cors:PolicyName") ?? "DefaultCorsPolicy";
        if (!isEnabled) return app;

        app.UseCors(policyName);
        return app;
    }

    /// <summary>
    /// 使用 SignalR Hub
    /// </summary>
    /// <param name="app">WebApplication 实例</param>
    /// <returns>WebApplication 实例</returns>
    static WebApplication UseSignalR(this WebApplication app)
    {
        var useSignalR = app.Configuration.GetValue<bool>("FrameworkSettings:UseSignalR");
        if (!useSignalR) return app;
        app.MapHub<NotificationHub>(app.Configuration.GetValue<string>("FrameworkSettings:HubUrl") ?? "/hubs/notifications");
        return app;
    }
}
