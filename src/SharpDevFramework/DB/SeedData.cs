using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SharpDevLib;

namespace SharpDevFramework;

internal static class SeedData
{
    public static void SeedDatabase(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<FrameworkDbContext>();
        context.Database.Migrate();

        if (!context.Users.Any())
        {
            var userName = RandomHelper.GenerateCode(RandomType.LetterLower, 6);
            var password = RandomHelper.GenerateCode(RandomType.Mix, 12);
            var passwordHasher = new PasswordHasher<UserEntity>();
            var user = new UserEntity
            {
                Name = userName,
                Role = UserRoleTypes.Admin,
            };
            user.PasswordHash = passwordHasher.HashPassword(user, password);
            context.Users.Add(user);
            context.SaveChanges();
            File.WriteAllText(Statics.InitAuthPath, $"{userName}\r\n{password}");
        }
    }
}
