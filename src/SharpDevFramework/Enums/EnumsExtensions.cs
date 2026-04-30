using Microsoft.AspNetCore.Builder;
using System.Reflection;

namespace SharpDevFramework;

public static class EnumsExtensions
{
    public static WebApplication UseEnums(this WebApplication app, Assembly[] assemblies)
    {
        EnumsController.Assemblies = assemblies;
        return app;
    }
}