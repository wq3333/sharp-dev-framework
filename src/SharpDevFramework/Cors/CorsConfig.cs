namespace SharpDevFramework;

/// <summary>
/// CORS 跨域配置
/// </summary>
internal class CorsConfig
{
    /// <summary>
    /// 策略名称
    /// </summary>
    public string PolicyName { get; set; } = "DefaultCorsPolicy";

    /// <summary>
    /// 允许的源列表
    /// </summary>
    public string[] Origins { get; set; } = [];

    /// <summary>
    /// 允许的 HTTP 方法列表
    /// </summary>
    public string[] Methods { get; set; } = [];

    /// <summary>
    /// 允许的请求头列表
    /// </summary>
    public string[] Headers { get; set; } = [];

    /// <summary>
    /// 是否允许携带凭证
    /// </summary>
    public bool AllowCredentials { get; set; }

    /// <summary>
    /// 暴露的响应头列表
    /// </summary>
    public string[] ExposedHeaders { get; set; } = [];

    /// <summary>
    /// 预检请求最大缓存时间（秒）
    /// </summary>
    public int? MaxAgeSeconds { get; set; }
}
