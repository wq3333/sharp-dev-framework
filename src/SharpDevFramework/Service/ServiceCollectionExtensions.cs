using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace SharpDevFramework;

internal static class ServiceCollectionExtensions
{
    public static IServiceCollection AddImplementationsOf(this IServiceCollection services, Assembly[] assembly)
    {
        return services
            .AddImplementationsOf<ISingletonService>(1, assembly)
            .AddImplementationsOf<IScopedService>(2, assembly)
            .AddImplementationsOf<ITransientService>(3, assembly);
    }

    static IServiceCollection AddImplementationsOf<TService>(this IServiceCollection services, int type, Assembly[] assembly)
    {
        var interfaceType = typeof(TService);
        var implementations = assembly
            .SelectMany(a => a.GetTypes())
            .Distinct()
            .Where(t => t.IsClass && !t.IsAbstract && interfaceType.IsAssignableFrom(t));

        foreach (var impl in implementations)
        {
            if (type == 1) services.AddSingleton(impl);
            else if (type == 2) services.AddScoped(impl);
            else if (type == 3) services.AddTransient(impl);
        }
        return services;
    }
}
