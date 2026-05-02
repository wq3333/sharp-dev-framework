namespace SharpDevFramework;

/// <summary>
/// 任务数据，用于创建新任务时传递数据
/// </summary>
public class TaskData
{
    /// <summary>
    /// 任务 ID
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// 任务类型
    /// </summary>
    public string Type { get; set; } = null!;
}
