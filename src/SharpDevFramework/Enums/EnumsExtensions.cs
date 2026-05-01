using Microsoft.AspNetCore.Builder;
using System.ComponentModel;
using System.Reflection;

namespace SharpDevFramework;

public static class EnumsExtensions
{
    public static WebApplication UseEnums(this WebApplication app, Assembly[] assemblies)
    {
        EnumsController.Assemblies = assemblies;
        return app;
    }

    internal static List<EnumItemsResponse> GetEnumItems(this Type type)
    {
        return [.. type.GetFields(BindingFlags.Public | BindingFlags.Static)
                .Select(x=>new EnumItemsResponse
                {
                    DisplayName=x.GetDescription(),
                    Value=x.GetValue(null)
                })];
    }

    internal static string GetDescription(this FieldInfo fieldInfo)
    {
        var attr = fieldInfo.GetCustomAttributes(typeof(DescriptionAttribute), false).FirstOrDefault() as DescriptionAttribute;
        return attr?.Description ?? fieldInfo.Name;
    }
}