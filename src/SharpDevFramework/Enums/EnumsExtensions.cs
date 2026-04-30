using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using SharpDevLib;
using System.ComponentModel;
using System.Reflection;

namespace SharpDevFramework;

public static class EnumsExtensions
{
    public static WebApplication UseEnums(this WebApplication app, Assembly[] assemblies)
    {
        var isEnabled = app.Configuration.GetValue<bool>("FrameworkSettings:Enums:IsEnabled");
        if (!isEnabled) return app;
        var enumsUrl = app.Configuration.GetValue<string>("FrameworkSettings:Enums:EnumsUrl");
        if (enumsUrl.NotNullOrWhiteSpace()) app.MapEnums(enumsUrl, assemblies);
        return app;
    }

    static List<EnumsResponse>? _cache = null;

    static void MapEnums(this WebApplication app, string url, Assembly[] assemblies)
    {
        app.MapGet(url, async (httpContext) =>
        {
            if (_cache is null)
            {
                _cache = [];
                var types = assemblies.SelectMany(x => x.GetTypes()).Distinct().ToList();
                var enumTypes = types.Where(x => x.IsPublic && x.IsEnum);
                foreach (var item in enumTypes)
                {
                    _cache.Add(new EnumsResponse { CategoryName = item.Name, Items = GetEnumItems(item) });
                }

                var userRoleTypesExtend = types.Where(x => x.IsPublic && !x.IsAbstract && x.GetCustomAttribute<UserRoleTypesEnumAttribute>() is not null)
                    .SelectMany(x => x.GetFields(BindingFlags.Public | BindingFlags.Static).Where(f => f.IsInitOnly)
                    .Select(y => y.GetValue(null) is not UserRoleTypes value ? null! : new EnumItemsResponse { DisplayName = value.DisplayName, Value = value.Id }));
                _cache.Add(new EnumsResponse { CategoryName = nameof(UserRoleTypes), Items = [.. userRoleTypesExtend.Where(x => x is not null)] });

                var taskTypesExtend = types.Where(x => x.IsPublic && !x.IsAbstract && x.GetCustomAttribute<TaskTypesEnumAttribute>() is not null)
                    .SelectMany(x => x.GetFields(BindingFlags.Public | BindingFlags.Static).Where(f => f.IsInitOnly)
                    .Select(y => y.GetValue(null) is not TaskTypes value ? null! : new EnumItemsResponse { DisplayName = value.DisplayName, Value = value.Id }));
                _cache.Add(new EnumsResponse { CategoryName = nameof(TaskTypes), Items = [.. taskTypesExtend.Where(x => x is not null)] });
            }

            httpContext.Response.StatusCode = 200;
            await httpContext.Response.WriteAsJsonAsync(DataReply.Succeed(_cache));
        }).AddEndpointFilter<IEndpointConventionBuilder, ExceptionEndpointFilter>();

        static List<EnumItemsResponse> GetEnumItems(Type type)
        {
            return [.. type.GetFields(BindingFlags.Public | BindingFlags.Static)
                .Select(x=>new EnumItemsResponse
                {
                    DisplayName=GetDescription(x)??x.Name,
                    Value=x.GetValue(null)
                })];
        }

        static string? GetDescription(FieldInfo fieldInfo)
        {
            var attr = fieldInfo.GetCustomAttributes(typeof(DescriptionAttribute), false).FirstOrDefault() as DescriptionAttribute;
            return attr?.Description;
        }
    }
}

public class EnumsResponse
{
    public string CategoryName { get; set; } = string.Empty;
    public List<EnumItemsResponse> Items { get; set; } = [];
}

public class EnumItemsResponse
{
    public string DisplayName { get; set; } = string.Empty;
    public object? Value { get; set; }
}
