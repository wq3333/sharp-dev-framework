using System.ComponentModel;

namespace SharpDevFramework;

public enum TaskStates
{
    [Description("待处理")]
    Pending,
    [Description("处理中")]
    Processing,
    [Description("已完成")]
    Completed,
    [Description("失败")]
    Failed,
    [Description("已取消")]
    Cancled
}