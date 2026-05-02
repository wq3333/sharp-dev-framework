using SharpDevLib;

namespace SharpDevFramework;

public class TaskEntity
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Data { get; set; }
    public TaskStates Status { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public long CreatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();
    public long UpdatedAt { get; set; } = DateTime.Now.ToUtcTimestamp();
    public bool IsDeleted { get; set; }
}
