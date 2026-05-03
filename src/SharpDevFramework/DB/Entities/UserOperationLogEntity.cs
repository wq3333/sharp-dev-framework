namespace SharpDevFramework;

/// <summary>
/// 用户操作日志实体
/// </summary>
public class UserOperationLogEntity : BaseEntity
{
    /// <summary>
    /// 用户 ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// 操作类型（Create/Update/Delete/Query 等）
    /// </summary>
    public string? OperationType { get; set; }

    /// <summary>
    /// 控制器名称
    /// </summary>
    public string? ControllerName { get; set; }

    /// <summary>
    /// 动作名称
    /// </summary>
    public string? ActionName { get; set; }

    /// <summary>
    /// 路由路径
    /// </summary>
    public string? RoutePath { get; set; }

    /// <summary>
    /// HTTP 方法
    /// </summary>
    public string? HttpMethod { get; set; }

    /// <summary>
    /// IP 地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// 用户代理
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 请求数据（JSON）
    /// </summary>
    public string? RequestData { get; set; }

    /// <summary>
    /// 响应数据（JSON）
    /// </summary>
    public string? ResponseData { get; set; }

    /// <summary>
    /// 执行耗时（毫秒）
    /// </summary>
    public long DurationMs { get; set; }

    /// <summary>
    /// 是否成功
    /// </summary>
    public bool IsSuccess { get; set; }

    /// <summary>
    /// 错误信息
    /// </summary>
    public string? ErrorMessage { get; set; }
}
