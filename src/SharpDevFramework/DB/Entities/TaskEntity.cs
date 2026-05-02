using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 任务实体
/// </summary>
public class TaskEntity
{
    /// <summary>
    /// 任务 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 创建用户 ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 任务类型
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 任务数据（JSON 格式）
    /// </summary>
    public string? Data { get; set; }

    /// <summary>
    /// 任务状态
    /// </summary>
    public TaskStates Status { get; set; }

    /// <summary>
    /// 错误信息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 重试次数
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// 创建时间戳
    /// </summary>
    public long CreatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();

    /// <summary>
    /// 更新时间戳
    /// </summary>
    public long UpdatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; }
}
