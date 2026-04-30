namespace SharpDevFramework;

public class JwtPayload
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long Exp { get; set; }
    public string Role { get; set; } = string.Empty;
}
