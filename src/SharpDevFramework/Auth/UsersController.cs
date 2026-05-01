using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SharpDevLib;

namespace SharpDevFramework;

[ApiController]
[Route("api/[controller]")]
public class UsersController(FrameworkDbContext context, TokenService tokenService, IConfiguration configuration) : ControllerBase
{
    void CheckAdmin()
    {
        if (HttpContext.GetJwtPayload().Role != UserRoleTypes.Admin.Id) throw new UnauthorizedAccessException("没有权限执行此操作");
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<DataReply<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (request.Username.IsNullOrWhiteSpace()) throw new Exception("username required");
        if (request.Password.IsNullOrWhiteSpace()) throw new Exception("password required");

        var user = context.Users.FirstOrDefault(u => u.Name == request.Username) ?? throw new Exception("用户名或密码错误");
        if (!user.IsActive) throw new Exception("账户已禁用");

        var now = DateTime.Now.ToUtcTimestamp();

        // 检查锁定状态
        if (user.LockoutUntil.HasValue && user.LockoutUntil.Value > now)
        {
            var remainingTime = user.LockoutUntil.Value - now;
            throw new Exception($"账户已锁定，请{TimeSpan.FromMilliseconds(remainingTime).TotalSeconds:F0}秒后重试");
        }

        var result = new PasswordHasher<UserEntity>().VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            var failedMinutes = configuration.GetValue<int>("FrameworkSettings:Auth:FailedMinutes");
            var maxFailedCount = configuration.GetValue<int>("FrameworkSettings:Auth:MaxFailedCount");
            var lockMinutes = configuration.GetValue<int>("FrameworkSettings:Auth:LockMinutes");
            if (user.LastFailedLoginTime.HasValue && (now - user.LastFailedLoginTime.Value) > TimeSpan.FromMinutes(failedMinutes).TotalMilliseconds)
            {
                user.FailedLoginAttempts = 0;
            }

            user.FailedLoginAttempts++;
            user.LastFailedLoginTime = now;

            if (user.FailedLoginAttempts >= maxFailedCount)
            {
                user.LockoutUntil = DateTime.Now.AddMinutes(lockMinutes).ToUtcTimestamp();
            }
            context.SaveChanges();
            throw new Exception("用户名或密码错误");
        }

        user.FailedLoginAttempts = 0;
        user.LastFailedLoginTime = null;
        user.LockoutUntil = null;
        user.LastLoginAt = now;
        user.LastLoginIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        context.SaveChanges();

        var token = tokenService.GenerateToken(user.Id, user.Name, user.Role);
        return DataReply.Succeed(new LoginResponse { Token = token, UserId = user.Id, Username = user.Name!, Role = user.Role });
    }

    [HttpPost("token")]
    public DataReply<string> Token()
    {
        var payload = HttpContext.GetJwtPayload();
        var token = tokenService.GenerateToken(payload.UserId, payload.Username, payload.Role);
        return DataReply.Succeed(token);
    }

    [HttpGet]
    public PageReply<UserDto> GetPage([FromQuery] UserPageRequest request)
    {
        CheckAdmin();
        var query = context.Users.Where(x => !x.IsDeleted);
        if (request.Name.NotNullOrWhiteSpace()) query = query.Where(x => x.Name!.Contains(request.Name));
        var total = query.Count();
        var items = query.OrderByDescending(u => u.CreatedAt).Skip((request.Index - 1) * request.Size).Take(request.Size).ToList();
        return PageReply.Succeed(items.Adapt<List<UserDto>>(), total, request);
    }

    [HttpGet("{id}")]
    public DataReply<UserDto> Get(int id)
    {
        CheckAdmin();
        var user = context.Users.Find(id) ?? throw new Exception("User not found");
        return DataReply.Succeed(user.Adapt<UserDto>());
    }

    [HttpPost]
    public EmptyReply Create([FromBody] CreateUserRequest request)
    {
        CheckAdmin();
        if (request.Name.IsNullOrWhiteSpace()) throw new Exception("用户名不能为空");
        if (request.Password.IsNullOrWhiteSpace()) throw new Exception("密码不能为空");
        if (context.Users.Any(u => u.Name == request.Name && !u.IsDeleted)) throw new Exception("用户名已存在");

        var user = new UserEntity
        {
            Name = request.Name,
            Role = request.Role,
        };
        user.PasswordHash = new PasswordHasher<UserEntity>().HashPassword(user, request.Password);
        context.Users.Add(user);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }

    [HttpPut("{id}")]
    public EmptyReply Update(int id, [FromBody] UpdateUserRequest request)
    {
        CheckAdmin();
        var user = context.Users.Find(id) ?? throw new Exception("data not found");
        if (id == HttpContext.GetJwtPayload().UserId && request.Role != user.Role) throw new Exception("不能修改自己的角色");

        if (request.Name.NotNullOrWhiteSpace() && request.Name != user.Name)
        {
            if (context.Users.Any(u => u.Name == request.Name && u.Id != id && !u.IsDeleted)) throw new Exception("用户名已存在");
            user.Name = request.Name;
        }

        if (request.Password.NotNullOrWhiteSpace())
        {
            user.PasswordHash = new PasswordHasher<UserEntity>().HashPassword(user, request.Password);
        }

        user.Role = request.Role;
        user.IsActive = request.IsActive;

        context.Users.Update(user);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }

    [HttpDelete("{id}")]
    public EmptyReply Delete(int id)
    {
        CheckAdmin();
        if (id == HttpContext.GetJwtPayload().UserId) throw new Exception("不能删除自己");
        var user = context.Users.Find(id) ?? throw new Exception("data not found");
        user.IsDeleted = true;
        context.Users.Update(user);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }
}

public class UserPageRequest : PageRequest
{
    public string? Name { get; set; }
}

public class CreateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string? Name { get; set; }
    public string? Password { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long CreatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int FailedLoginAttempts { get; set; }
    public long? LockoutUntil { get; set; }
    public long? LastFailedLoginTime { get; set; }
    public long? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class LoginResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
