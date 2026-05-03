using System.ComponentModel;

namespace SharpDevFramework;

/// <summary>
/// 框架内置任务类型
/// </summary>
[MockEnum("TaskTypes")]
public static class FrameworkTaskTypes
{
    /// <summary>
    /// 保存操作日志
    /// </summary>
    [Description("保存操作日志")]
    public const string OperationLogSave = nameof(OperationLogSave);

    /// <summary>
    /// 数据清理
    /// </summary>
    [Description("数据清理")]
    public const string DataCleanup = nameof(DataCleanup);
}
