using Microsoft.EntityFrameworkCore;

namespace SharpDevFramework;

/// <summary>
/// 框架数据库上下文基类
/// </summary>
public abstract class FrameworkDbContext(DbContextOptions options) : DbContext(options)
{
    /// <summary>
    /// 用户表
    /// </summary>
    public DbSet<UserEntity> Users { get; set; }

    /// <summary>
    /// 任务表
    /// </summary>
    public DbSet<TaskEntity> Tasks { get; set; }

    /// <summary>
    /// 用户操作日志表
    /// </summary>
    public DbSet<UserOperationLogEntity> UserOperationLogs { get; set; }
}
