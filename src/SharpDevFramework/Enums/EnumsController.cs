using Mapster;
using Microsoft.AspNetCore.Mvc;
using SharpDevLib;
using System.ComponentModel;
using System.Reflection;

namespace SharpDevFramework;

[ApiController]
[Route("api/[controller]")]
public class EnumsController : ControllerBase
{
    internal static Assembly[] Assemblies = [];
    static List<EnumsResponse>? _cache = null;

    [HttpGet]
    public DataReply<List<EnumsResponse>> Get()
    {
        if (_cache is null)
        {
            _cache = [];
            var types = Assemblies.SelectMany(x => x.GetTypes()).Distinct().ToList();
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
        return DataReply.Succeed(_cache);
    }
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
