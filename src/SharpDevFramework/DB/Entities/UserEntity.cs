using SharpDevLib;

namespace SharpDevFramework;

public class UserEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public long CreatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();
    public bool IsActive { get; set; } = true;
    public int FailedLoginAttempts { get; set; }
    public long? LockoutUntil { get; set; }
    public long? LastFailedLoginTime { get; set; }
    public long? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}
