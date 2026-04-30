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

public static class FrameworkExtensions
{
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

    public static WebApplication UseSharpDevFramework(this WebApplication app, Assembly[] assemblies)
    {
        app.UseDefaultFiles()
            .UseStaticFiles();

        app.UseCors()
            .UseSignalR()
            .UseAuth()
            .UseEnums(assemblies);

        app.MapControllers();
        app.SeedDatabase();
        return app;
    }

    static WebApplicationBuilder AddSettings(this WebApplicationBuilder builder)
    {
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("appsettings.json"), optional: false, reloadOnChange: true);
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("appsettings.local.json"), optional: true, reloadOnChange: true);
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("framework.json"), optional: true, reloadOnChange: true);
        builder.Configuration.AddJsonFile(AppDomain.CurrentDomain.BaseDirectory.CombinePath("framework.local.json"), optional: true, reloadOnChange: true);
        return builder;
    }

    static WebApplicationBuilder AddSerialog(this WebApplicationBuilder builder)
    {
        var isEnabled = builder.Configuration.GetValue<bool>("FrameworkSettings:Serilog:IsEnabled");
        if (!isEnabled) return builder;
        Environment.SetEnvironmentVariable("Serilog:WriteTo:0:Args:path", Statics.LogsPath);
        builder.Configuration.AddEnvironmentVariables();
        builder.Host.UseSerilog((context, _, configuration) =>
        {
            configuration.ReadFrom.Configuration(context.Configuration.GetSection("FrameworkSettings:Serilog"));
        });
        return builder;
    }

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

    static WebApplicationBuilder AddFilters(this WebApplicationBuilder builder)
    {
        var useAuthFilter = builder.Configuration.GetValue<bool>("FrameworkSettings:Auth:IsEnabled");
        var useExceptionFilter = builder.Configuration.GetValue<bool>("FrameworkSettings:UseExceptionFilter");

        builder.Services.AddControllers(options =>
        {
            if (useAuthFilter)
            {
                if (!File.Exists(Statics.JwtSecretPath)) File.WriteAllText(Statics.JwtSecretPath, RandomHelper.GenerateCode(RandomType.Mix, 255));
                options.Filters.Add<AuthFilter>();
            }
            if (useExceptionFilter) options.Filters.Add<ExceptionFilter>();
        });
        return builder;
    }

    static WebApplicationBuilder AddWindowsService(this WebApplicationBuilder builder)
    {
        var useWindowsService = builder.Configuration.GetValue<bool>("FrameworkSettings:UseWindowsService");
        if (!useWindowsService) return builder;
        builder.Host.UseWindowsService();
        return builder;
    }

    static WebApplicationBuilder AddDbContext<TDbContext>(this WebApplicationBuilder builder) where TDbContext : FrameworkDbContext
    {
        builder.Services.AddDbContext<TDbContext>(options => options.UseSqlite($"Data Source={Statics.DatabasePath}"));
        builder.Services.AddScoped<FrameworkDbContext, TDbContext>();
        return builder;
    }

    static WebApplicationBuilder AddServices(this WebApplicationBuilder builder, Assembly[] assemblies)
    {
        builder.Services.AddImplementationsOf(assemblies);
        builder.Services.AddHttpClient();
        builder.Services.AddHttpContextAccessor();
        return builder;
    }

    static WebApplicationBuilder AddSignalR(this WebApplicationBuilder builder)
    {
        var useSignalR = builder.Configuration.GetValue<bool>("FrameworkSettings:UseSignalR");
        if (!useSignalR) return builder;
        builder.Services.AddSignalR();
        return builder;
    }

    static WebApplicationBuilder AddTasks(this WebApplicationBuilder builder, Assembly[] assemblies)
    {
        var isEnabled = builder.Configuration.GetValue<bool>("FrameworkSettings:Tasks:IsEnabled");
        if (!isEnabled) return builder;
        TaskHostedService.Assemblies = assemblies;
        builder.Services.AddHostedService<TaskHostedService>();
        return builder;
    }

    static WebApplication UseCors(this WebApplication app)
    {
        var isEnabled = app.Configuration.GetValue<bool>("FrameworkSettings:Cors:IsEnabled");
        var policyName = app.Configuration.GetValue<string>("FrameworkSettings:Cors:PolicyName") ?? "DefaultCorsPolicy";
        if (!isEnabled) return app;

        app.UseCors(policyName);
        return app;
    }

    static WebApplication UseSignalR(this WebApplication app)
    {
        var useSignalR = app.Configuration.GetValue<bool>("FrameworkSettings:UseSignalR");
        if (!useSignalR) return app;
        app.MapHub<NotificationHub>(app.Configuration.GetValue<string>("FrameworkSettings:HubUrl") ?? "/hubs/notifications");
        return app;
    }
}
