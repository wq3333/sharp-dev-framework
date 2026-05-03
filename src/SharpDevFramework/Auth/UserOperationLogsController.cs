using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 用户操作日志控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UserOperationLogsController(FrameworkDbContext dbContext) : ControllerBase
{
    void CheckAdmin()
    {
        if (!HttpContext.GetJwtPayload().Role.SplitToList().Any(x => x == UserRoleTypes.Admin)) throw new UnauthorizedAccessException("没有权限执行此操作");
    }

    /// <summary>
    /// 分页查询操作日志
    /// </summary>
    /// <param name="request">分页request</param>
    /// <returns></returns>
    [HttpGet]
    public async Task<PageReply<UserOperationLogEntity>> Page([FromQuery] PageUserOperationLogRequest request)
    {
        CheckAdmin();
        var query = dbContext.UserOperationLogs.AsQueryable();

        if (request.Username.NotNullOrWhiteSpace()) query = query.Where(x => x.UserName != null && x.UserName.Contains(request.Username));
        if (request.OperationType.NotNullOrWhiteSpace())
        {
            var types = request.OperationType.SplitToList();
            query = query.Where(x => x.OperationType != null && types.Contains(x.OperationType));
        }
        if (request.IsSuccess.HasValue) query = query.Where(x => x.IsSuccess == request.IsSuccess.Value);
        if (request.StartTime.HasValue) query = query.Where(x => x.CreatedAt >= request.StartTime.Value);
        if (request.EndTime.HasValue) query = query.Where(x => x.CreatedAt <= request.EndTime.Value);
        var total = await query.CountAsync();
        var data = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.Index - 1) * request.Size)
            .Take(request.Size)
            .ToListAsync();
        return PageReply.Succeed(data, total, request);
    }

    /// <summary>
    /// 获取操作日志详情
    /// </summary>
    /// <param name="id">日志ID</param>
    /// <returns></returns>
    [HttpGet("{id}")]
    public async Task<DataReply<UserOperationLogEntity>> Get(int id)
    {
        CheckAdmin();
        var log = await dbContext.UserOperationLogs.FindAsync(id);
        return log == null ? throw new Exception("日志不存在") : DataReply.Succeed(log);
    }
}

/// <summary>
/// 分页查询用户操作记录Request
/// </summary>
public class PageUserOperationLogRequest : PageRequest
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string? Username { get; set; }
    /// <summary>
    /// 操作类型,逗号分隔
    /// </summary>
    public string? OperationType { get; set; }
    /// <summary>
    /// 是否成功
    /// </summary>
    public bool? IsSuccess { get; set; }
    /// <summary>
    /// 开始时间
    /// </summary>
    public long? StartTime { get; set; }
    /// <summary>
    /// 结束时间
    /// </summary>
    public long? EndTime { get; set; }
}
