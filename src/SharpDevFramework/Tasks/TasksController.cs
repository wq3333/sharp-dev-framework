using Mapster;
using Microsoft.AspNetCore.Mvc;
using SharpDevLib;

namespace SharpDevFramework;

/// <summary>
/// 任务控制器，提供任务的分页查询、删除、重试和取消功能
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TasksController(FrameworkDbContext context, TaskCenter taskCenter) : ControllerBase
{
    /// <summary>
    /// 分页查询任务列表
    /// </summary>
    /// <param name="request">查询请求参数</param>
    /// <returns>分页任务列表</returns>
    [HttpGet]
    public PageReply<TaskDto> GetPage([FromQuery] TaskRequest request)
    {
        var query = context.Tasks.AsQueryable();
        if (request.StatusList.NotNullOrEmpty()) query = query.Where(x => request.StatusList.Contains(x.Status));
        if (request.Type.NotNullOrWhiteSpace())
        {
            var types = request.Type.SplitToList();
            var predicate = DbHelper.BuildOrLikeExpression<TaskEntity>("Type", [.. types]);
            query = query.Where(predicate);
        }

        var total = query.Count();
        var items = query.OrderByDescending(x => x.CreatedAt)
                         .Skip((request.Index - 1) * request.Size)
                         .Take(request.Size)
                         .ToList();
        return PageReply.Succeed(items.Adapt<List<TaskDto>>(), total, request);
    }

    /// <summary>
    /// 获取单个任务详情
    /// </summary>
    /// <param name="id">任务 ID</param>
    /// <returns>任务详情</returns>
    [HttpGet("{id}")]
    public DataReply<TaskDto> Get(int id)
    {
        var task = context.Tasks.FirstOrDefault(x => x.Id == id) ?? throw new Exception("任务不存在");
        return DataReply.Succeed(task.Adapt<TaskDto>());
    }

    /// <summary>
    /// 删除任务
    /// </summary>
    /// <param name="id">任务 ID</param>
    /// <returns>操作结果</returns>
    [HttpDelete("{id}")]
    [Role([UserRoleTypes.Admin])]
    public EmptyReply Delete(int id)
    {
        var task = context.Tasks.FirstOrDefault(x => x.Id == id) ?? throw new Exception("任务不存在");
        context.Tasks.Remove(task);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }

    /// <summary>
    /// 重试失败的任务
    /// </summary>
    /// <param name="id">任务 ID</param>
    /// <returns>操作结果</returns>
    [HttpPost("{id}/retry")]
    public async Task<EmptyReply> Retry(int id)
    {
        var task = context.Tasks.Find(id) ?? throw new Exception("任务不存在");
        if (task.Status == TaskStates.Processing) throw new Exception("任务正在执行中，无法重试");

        task.Status = TaskStates.Pending;
        task.ErrorMessage = null;
        task.RetryCount = 0;
        context.SaveChanges();
        await taskCenter.PublishAsync(task.Id);
        return EmptyReply.Succeed();
    }

    /// <summary>
    /// 取消正在执行的任务
    /// </summary>
    /// <param name="id">任务 ID</param>
    /// <returns>操作结果</returns>
    [HttpPost("{id}/cancel")]
    public async Task<EmptyReply> Cancel(int id)
    {
        var task = context.Tasks.Find(id) ?? throw new Exception("任务不存在");
        if (task.Status != TaskStates.Processing) throw new Exception("任务无法取消");
        await taskCenter.CancelTaskAsync(id);
        return EmptyReply.Succeed();
    }

    /// <summary>
    /// 清理数据库
    /// </summary>
    /// <returns>操作结果</returns>
    [HttpPost("cleandb")]
    [Role([UserRoleTypes.Admin])]
    public async Task<EmptyReply> CleanDB()
    {
        var cleanTask = new TaskEntity { Type = FrameworkTaskTypes.DataCleanup };
        context.Tasks.Add(cleanTask);
        context.SaveChanges();
        await taskCenter.PublishAsync(cleanTask.Id);
        return EmptyReply.Succeed();
    }
}

/// <summary>
/// 任务查询请求
/// </summary>
public class TaskRequest : PageRequest
{
    /// <summary>
    /// 任务状态（逗号分隔）
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// 任务状态列表
    /// </summary>
    public List<TaskStates> StatusList => Status.IsNullOrWhiteSpace() ? [] : [.. Status.SplitToList().Select(x => x.ToEnum<TaskStates>())];

    /// <summary>
    /// 任务类型
    /// </summary>
    public string? Type { get; set; }
}

/// <summary>
/// 任务数据传输对象
/// </summary>
public class TaskDto
{
    /// <summary>
    /// 任务 ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 创建用户 ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 任务类型
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 任务数据
    /// </summary>
    public string? Data { get; set; }

    /// <summary>
    /// 任务状态
    /// </summary>
    public TaskStates Status { get; set; }

    /// <summary>
    /// 错误信息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 重试次数
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// 创建时间戳
    /// </summary>
    public long CreatedAt { get; set; }

    /// <summary>
    /// 更新时间戳
    /// </summary>
    public long UpdatedAt { get; set; }

    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; }
}
