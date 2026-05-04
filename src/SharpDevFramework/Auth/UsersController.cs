using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 用户控制器，提供用户登录、CRUD 等功能
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController(FrameworkDbContext context, TokenService tokenService, IConfiguration configuration) : ControllerBase
{
    /// <summary>
    /// 检查是否为管理员
    /// </summary>
    /// <exception cref="UnauthorizedAccessException">非管理员时抛出异常</exception>
    void CheckAdmin()
    {
        if (!HttpContext.GetJwtPayload().Role.SplitToList().Any(x => x == UserRoleTypes.Admin)) throw new UnauthorizedAccessException("没有权限执行此操作");
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    /// <param name="request">登录请求（用户名、密码）</param>
    /// <returns>登录响应（Token、用户信息）</returns>
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

    /// <summary>
    /// 刷新 Token
    /// </summary>
    /// <returns>新的 Token</returns>
    [HttpPost("token")]
    public DataReply<string> Token()
    {
        var payload = HttpContext.GetJwtPayload();
        var token = tokenService.GenerateToken(payload.UserId, payload.Username, payload.Role);
        return DataReply.Succeed(token);
    }

    /// <summary>
    /// 分页查询用户列表（仅管理员）
    /// </summary>
    /// <param name="request">查询参数</param>
    /// <returns>用户分页列表</returns>
    [HttpGet]
    public PageReply<UserDto> GetPage([FromQuery] UserPageRequest request)
    {
        CheckAdmin();
        var query = context.Users.Where(x => !x.IsDeleted);
        if (request.Name.NotNullOrWhiteSpace()) query = query.Where(x => x.Name!.Contains(request.Name));
        if (request.Role.NotNullOrWhiteSpace())
        {
            var roles = request.Role.SplitToList();
            var predicate = DbHelper.BuildOrLikeExpression<UserEntity>("Role", [.. roles]);
            query = query.Where(predicate);
        }
        var total = query.Count();
        var items = query.OrderByDescending(u => u.CreatedAt).Skip((request.Index - 1) * request.Size).Take(request.Size).ToList();
        return PageReply.Succeed(items.Adapt<List<UserDto>>(), total, request);
    }

    /// <summary>
    /// 获取单个用户详情（仅管理员）
    /// </summary>
    /// <param name="id">用户 ID</param>
    /// <returns>用户详情</returns>
    [HttpGet("{id}")]
    public DataReply<UserDto> Get(int id)
    {
        CheckAdmin();
        var user = context.Users.Find(id) ?? throw new Exception("User not found");
        return DataReply.Succeed(user.Adapt<UserDto>());
    }

    /// <summary>
    /// 创建用户（仅管理员）
    /// </summary>
    /// <param name="request">创建用户请求</param>
    /// <returns>操作结果</returns>
    [HttpPost]
    public EmptyReply Create([FromBody] CreateUserRequest request)
    {
        CheckAdmin();
        if (request.Name.IsNullOrWhiteSpace()) throw new Exception("用户名不能为空");
        if (request.Password.IsNullOrWhiteSpace()) throw new Exception("密码不能为空");
        if (request.Role.IsNullOrWhiteSpace()) throw new Exception("角色不能为空");
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

    /// <summary>
    /// 更新用户（仅管理员）
    /// </summary>
    /// <param name="id">用户 ID</param>
    /// <param name="request">更新用户请求</param>
    /// <returns>操作结果</returns>
    [HttpPut("{id}")]
    public EmptyReply Update(int id, [FromBody] UpdateUserRequest request)
    {
        CheckAdmin();
        if (request.Name.IsNullOrWhiteSpace()) throw new Exception("用户名不能为空");
        if (request.Role.IsNullOrWhiteSpace()) throw new Exception("角色不能为空");
        var user = context.Users.Find(id) ?? throw new Exception("data not found");
        if (id == HttpContext.GetJwtPayload().UserId && request.Role != user.Role) throw new Exception("不能修改自己的角色");
        if (context.Users.Any(u => u.Name == request.Name && u.Id != id && !u.IsDeleted)) throw new Exception("用户名已存在");
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

    /// <summary>
    /// 删除用户（仅管理员）
    /// </summary>
    /// <param name="id">用户 ID</param>
    /// <returns>操作结果</returns>
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

/// <summary>
/// 用户分页查询请求
/// </summary>
public class UserPageRequest : PageRequest
{
    /// <summary>
    /// 用户名（模糊查询）
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 角色
    /// </summary>
    public string? Role { get; set; }
}

/// <summary>
/// 创建用户请求
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 角色
    /// </summary>
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// 更新用户请求
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 密码（可选）
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// 角色
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// 是否激活
    /// </summary>
    public bool IsActive { get; set; }
}

/// <summary>
/// 用户数据传输对象
/// </summary>
public class UserDto
{
    /// <summary>
    /// 用户 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间戳
    /// </summary>
    public long CreatedAt { get; set; }

    /// <summary>
    /// 是否激活
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 连续登录失败次数
    /// </summary>
    public int FailedLoginAttempts { get; set; }

    /// <summary>
    /// 锁定截止时间戳
    /// </summary>
    public long? LockoutUntil { get; set; }

    /// <summary>
    /// 上次登录失败时间戳
    /// </summary>
    public long? LastFailedLoginTime { get; set; }

    /// <summary>
    /// 上次登录时间戳
    /// </summary>
    public long? LastLoginAt { get; set; }

    /// <summary>
    /// 上次登录 IP 地址
    /// </summary>
    public string? LastLoginIp { get; set; }

    /// <summary>
    /// 角色
    /// </summary>
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// 登录请求
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// 密码
    /// </summary>
    public string? Password { get; set; }
}

/// <summary>
/// 登录响应
/// </summary>
public class LoginResponse
{
    /// <summary>
    /// 用户 ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// JWT Token
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// 角色
    /// </summary>
    public string Role { get; set; } = string.Empty;
}
