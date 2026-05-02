using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 用户实体
/// </summary>
public class UserEntity
{
    /// <summary>
    /// 用户 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 密码哈希
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间戳
    /// </summary>
    public long CreatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();

    /// <summary>
    /// 是否激活
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 连续登录失败次数
    /// </summary>
    public int FailedLoginAttempts { get; set; }

    /// <summary>
    /// 锁定截止时间戳
    /// </summary>
    public long? LockoutUntil { get; set; }

    /// <summary>
    /// 上次登录失败时间戳
    /// </summary>
    public long? LastFailedLoginTime { get; set; }

    /// <summary>
    /// 上次登录时间戳
    /// </summary>
    public long? LastLoginAt { get; set; }

    /// <summary>
    /// 上次登录 IP 地址
    /// </summary>
    public string? LastLoginIp { get; set; }

    /// <summary>
    /// 用户角色
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; }
}
