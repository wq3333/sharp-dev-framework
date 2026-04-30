namespace SharpDevFramework;

internal class CorsConfig
{
    public string PolicyName { get; set; } = "DefaultCorsPolicy";
    public string[] Origins { get; set; } = [];
    public string[] Methods { get; set; } = [];
    public string[] Headers { get; set; } = [];
    public bool AllowCredentials { get; set; }
    public string[] ExposedHeaders { get; set; } = [];
    public int? MaxAgeSeconds { get; set; }
}
