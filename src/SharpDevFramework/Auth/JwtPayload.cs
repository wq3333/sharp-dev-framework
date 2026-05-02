namespace SharpDevFramework;

/// <summary>
/// JWT 负载信息
/// </summary>
public class JwtPayload
{
    /// <summary>
    /// 用户 ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 过期时间戳（UTC）
    /// </summary>
    public long Exp { get; set; }

    /// <summary>
    /// 用户角色
    /// </summary>
    public string Role { get; set; } = string.Empty;
}
