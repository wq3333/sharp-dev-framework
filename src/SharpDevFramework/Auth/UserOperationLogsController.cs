using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 用户操作日志控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserOperationLogsController(FrameworkDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// 分页查询操作日志
    /// </summary>
    /// <param name="username">用户名（模糊搜索）</param>
    /// <param name="operationType">操作类型（多个用逗号分隔）</param>
    /// <param name="isSuccess">是否成功（true/false）</param>
    /// <param name="startTimestamp">开始时间戳</param>
    /// <param name="endTimestamp">结束时间戳</param>
    /// <param name="index">页码（从1开始）</param>
    /// <param name="size">每页数量</param>
    /// <returns></returns>
    [HttpGet]
    public async Task<PageReply<UserOperationLogEntity>> Page(
        [FromQuery] string? username = null,
        [FromQuery] string? operationType = null,
        [FromQuery] bool? isSuccess = null,
        [FromQuery] long? startTimestamp = null,
        [FromQuery] long? endTimestamp = null,
        [FromQuery] int index = 1,
        [FromQuery] int size = 20)
    {
        var query = dbContext.UserOperationLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(username))
        {
            query = query.Where(x => x.UserName != null && x.UserName.Contains(username));
        }

        if (!string.IsNullOrWhiteSpace(operationType))
        {
            var types = operationType.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList();
            if (types.Count > 0)
            {
                query = query.Where(x => x.OperationType != null && types.Contains(x.OperationType));
            }
        }

        if (isSuccess.HasValue)
        {
            query = query.Where(x => x.IsSuccess == isSuccess.Value);
        }

        if (startTimestamp.HasValue)
        {
            query = query.Where(x => x.CreatedAt >= startTimestamp.Value);
        }

        if (endTimestamp.HasValue)
        {
            query = query.Where(x => x.CreatedAt <= endTimestamp.Value);
        }

        var total = await query.CountAsync();
        var data = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((index - 1) * size)
            .Take(size)
            .ToListAsync();

        return PageReply.Succeed(data, total, index, size);
    }

    /// <summary>
    /// 获取操作日志详情
    /// </summary>
    /// <param name="id">日志ID</param>
    /// <returns></returns>
    [HttpGet("{id}")]
    public async Task<DataReply<UserOperationLogEntity>> Get(int id)
    {
        var log = await dbContext.UserOperationLogs.FindAsync(id);
        if (log == null) throw new Exception("日志不存在");
        return DataReply.Succeed(log);
    }
}
