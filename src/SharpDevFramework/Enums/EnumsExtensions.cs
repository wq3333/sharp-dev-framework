using Microsoft.AspNetCore.Builder;
using System.ComponentModel;
using System.Reflection;

namespace SharpDevFramework;

/// <summary>
/// 枚举相关扩展方法
/// </summary>
internal static class EnumsExtensions
{
    /// <summary>
    /// 使用枚举控制器
    /// </summary>
    /// <param name="app">WebApplication 实例</param>
    /// <param name="assemblies">需要扫描的程序集数组</param>
    /// <returns>WebApplication 实例</returns>
    public static WebApplication UseEnums(this WebApplication app, Assembly[] assemblies)
    {
        EnumsController.Assemblies = assemblies;
        return app;
    }

    /// <summary>
    /// 获取枚举项列表
    /// </summary>
    /// <param name="type">枚举类型</param>
    /// <returns>枚举项响应列表</returns>
    internal static List<EnumItemsResponse> GetEnumItems(this Type type)
    {
        return [.. type.GetFields(BindingFlags.Public | BindingFlags.Static)
                .Select(x=>new EnumItemsResponse
                {
                    DisplayName=x.GetDescription(),
                    Value=x.GetValue(null)
                })];
    }

    /// <summary>
    /// 获取字段的 Description 属性值
    /// </summary>
    /// <param name="fieldInfo">字段信息</param>
    /// <returns>描述文本</returns>
    internal static string GetDescription(this FieldInfo fieldInfo)
    {
        var attr = fieldInfo.GetCustomAttributes(typeof(DescriptionAttribute), false).FirstOrDefault() as DescriptionAttribute;
        return attr?.Description ?? fieldInfo.Name;
    }
}