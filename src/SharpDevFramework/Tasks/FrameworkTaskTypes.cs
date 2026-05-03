using System.ComponentModel;

namespace SharpDevFramework;

/// <summary>
/// 框架内置任务类型
/// </summary>
[MockEnum("TaskTypes")]
public class FrameworkTaskTypes
{
    /// <summary>
    /// 数据清理
    /// </summary>
    [Description("数据清理")]
    public const string DataCleanup = nameof(DataCleanup);
}
