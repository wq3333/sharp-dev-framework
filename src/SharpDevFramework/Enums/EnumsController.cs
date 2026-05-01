using Mapster;
using Microsoft.AspNetCore.Mvc;
using SharpDevLib;
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

            var enumTypes = types.Where(x => x.IsPublic && x.IsEnum).Select(x => new EnumsResponse { CategoryName = x.Name, Items = x.GetEnumItems() });
            _cache.AddRange(enumTypes);

            var mockTypes = types.Where(x => x.IsPublic && !x.IsAbstract && x.GetCustomAttribute<MockEnumAttribute>() is not null)
                .Select(x =>
                {
                    var categoryName = x.GetCustomAttribute<MockEnumAttribute>()!.MockEnumName;
                    var items = x.GetFields(BindingFlags.Public | BindingFlags.Static)
                        .Select(y => new EnumItemsResponse { DisplayName = y.GetDescription(), Value = y.GetValue(null) });
                    return new { categoryName, items };
                });
            _cache.AddRange(mockTypes.GroupBy(x => x.categoryName).Select(x => new EnumsResponse { CategoryName = x.Key, Items = [.. x.SelectMany(y => y.items)] }));
        }
        return DataReply.Succeed(_cache);
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
