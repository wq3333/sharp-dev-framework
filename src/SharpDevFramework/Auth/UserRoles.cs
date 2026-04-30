using SharpDevLib;

namespace SharpDevFramework;

[AttributeUsage(AttributeTargets.Class)]
public class UserRoleTypesEnumAttribute : Attribute { }

[UserRoleTypesEnum]
public class UserRoleTypes
{
    static readonly List<string> _ids = [];
    public static readonly UserRoleTypes Admin = new(nameof(Admin), "管理员");

    public string Id { get; }

    public string DisplayName { get; }

    public UserRoleTypes(string id, string displayName)
    {
        if (id.IsNullOrWhiteSpace()) throw new Exception("Id required");
        if (_ids.Contains(id)) throw new Exception($"id '{id}' already exists");
        _ids.Add(id);
        Id = id;
        DisplayName = displayName;
    }
}