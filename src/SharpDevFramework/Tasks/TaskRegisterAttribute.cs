namespace SharpDevFramework;

[AttributeUsage(AttributeTargets.Class)]
public class TaskRegisterAttribute(string type) : Attribute
{
    public string Type { get; set; } = type;
}