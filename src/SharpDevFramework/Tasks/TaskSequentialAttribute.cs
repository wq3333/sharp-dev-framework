namespace SharpDevFramework;

/// <summary>
/// 任务串行执行特性，标记在任务处理器类上，表示该类型的任务不允许并发执行，同类型任务将串行处理
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class TaskSequentialAttribute : Attribute
{
}
