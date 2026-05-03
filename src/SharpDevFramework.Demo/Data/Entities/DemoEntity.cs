using SharpDevLib;

namespace SharpDevFramework.Demo.Data.Entities;

public class DemoEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public long? UpdatedAt { get; set; }
}