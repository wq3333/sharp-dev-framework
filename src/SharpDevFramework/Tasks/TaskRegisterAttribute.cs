namespace SharpDevFramework;

[AttributeUsage(AttributeTargets.Class)]
public class TaskRegisterAttribute : Attribute
{
    public TaskTypes Type { get; set; } = null!;
}
