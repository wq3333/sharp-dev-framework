using SharpDevLib;

namespace SharpDevFramework.Demo.Data.Entities;

public class DemoEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Active";
    public string? Category { get; set; }
    public long CreatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();
    public long? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}