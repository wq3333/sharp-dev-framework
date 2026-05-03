using System.ComponentModel;

namespace SharpDevFramework.Demo.Enums;

[MockEnum(nameof(TaskTypes))]
public class TaskTypes
{
    [Description("演示任务")]
    public const string Demo = nameof(Demo);
}
