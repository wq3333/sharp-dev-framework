namespace SharpDevFramework;

/// <summary>
/// 任务注册特性，用于标记任务处理器类
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class TaskRegisterAttribute(string type) : Attribute
{
    /// <summary>
    /// 任务类型标识
    /// </summary>
    public string Type { get; set; } = type;
}