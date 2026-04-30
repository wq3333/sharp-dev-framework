namespace SharpDevFramework;

public class JwtPayload
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public long Exp { get; set; }
    public string Role { get; set; } = string.Empty;
}
