using Microsoft.EntityFrameworkCore;
using SharpDevFramework.Demo.Data.Entities;

namespace SharpDevFramework.Demo.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : FrameworkDbContext(options)
{
    public DbSet<DemoEntity> Demos { get; set; }
}
