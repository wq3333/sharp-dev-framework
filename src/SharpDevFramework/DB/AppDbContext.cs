using Microsoft.EntityFrameworkCore;

namespace SharpDevFramework;

public abstract class FrameworkDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<UserEntity> Users { get; set; }
    public DbSet<TaskEntity> Tasks { get; set; }
}
