using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 实体基类
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 创建时间戳
    /// </summary>
    public long CreatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; }
}
