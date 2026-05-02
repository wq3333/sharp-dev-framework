using System.ComponentModel;

namespace SharpDevFramework;

/// <summary>
/// 任务状态枚举
/// </summary>
public enum TaskStates
{
    /// <summary>
    /// 待处理
    /// </summary>
    [Description("待处理")]
    Pending,

    /// <summary>
    /// 处理中
    /// </summary>
    [Description("处理中")]
    Processing,

    /// <summary>
    /// 已完成
    /// </summary>
    [Description("已完成")]
    Completed,

    /// <summary>
    /// 失败
    /// </summary>
    [Description("失败")]
    Failed,

    /// <summary>
    /// 已取消
    /// </summary>
    [Description("已取消")]
    Cancled
}