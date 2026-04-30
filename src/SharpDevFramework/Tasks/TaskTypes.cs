using SharpDevLib;

namespace SharpDevFramework;

[AttributeUsage(AttributeTargets.Class)]
public class TaskTypesEnumAttribute : Attribute { }

[TaskTypesEnum]
public class TaskTypes
{
    static readonly List<string> _ids = [];

    public string Id { get; }

    public string DisplayName { get; }

    public TaskTypes(string id, string displayName)
    {
        if (id.IsNullOrWhiteSpace()) throw new Exception("Id required");
        if (_ids.Contains(id)) throw new Exception($"id '{id}' already exists");
        _ids.Add(id);
        Id = id;
        DisplayName = displayName;
    }
}