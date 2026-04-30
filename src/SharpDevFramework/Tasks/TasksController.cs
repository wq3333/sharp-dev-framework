using Mapster;
using Microsoft.AspNetCore.Mvc;
using SharpDevLib;

namespace SharpDevFramework;

[ApiController]
[Route("api/[controller]")]
public class TasksController(FrameworkDbContext context, TaskCenter taskCenter) : ControllerBase
{
    [HttpGet]
    public PageReply<TaskDto> GetPage([FromQuery] TaskRequest request)
    {
        var query = context.Tasks.AsQueryable();
        if (request.Status.NotNullOrEmpty()) query = query.Where(x => request.Status.Contains(x.Status));
        var total = query.Count();
        var items = query.OrderByDescending(x => x.CreatedAt)
                         .Skip((request.Index - 1) * request.Size)
                         .Take(request.Size)
                         .ToList();
        return PageReply.Succeed(items.Adapt<List<TaskDto>>(), total, request);
    }

    [HttpDelete("{id}")]
    public EmptyReply Delete(int id)
    {
        var task = context.Tasks.FirstOrDefault(x => x.Id == id) ?? throw new Exception("任务不存在");
        context.Tasks.Remove(task);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }

    [HttpPost("{id}/retry")]
    public async Task<EmptyReply> Retry(int id)
    {
        var task = context.Tasks.Find(id) ?? throw new Exception("任务不存在");
        if (task.Status == TaskStates.Processing) throw new Exception("任务正在执行中，无法重试");

        task.Status = TaskStates.Pending;
        task.ErrorMessage = null;
        task.RetryCount = 0;
        context.SaveChanges();
        await taskCenter.PublishAsync(task.Type, task.Id);
        return EmptyReply.Succeed();
    }

    [HttpPost("{id}/cancel")]
    public async Task<EmptyReply> Cancel(int id)
    {
        var task = context.Tasks.Find(id) ?? throw new Exception("任务不存在");
        if (task.Status != TaskStates.Processing) throw new Exception("任务无法取消");
        await taskCenter.CancelTaskAsync(id);
        return EmptyReply.Succeed();
    }
}

public class TaskRequest : PageRequest
{
    public List<TaskStates> Status { get; set; } = [];
}

public class TaskDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Data { get; set; }
    public TaskStates Status { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public long CreatedAt { get; set; }
    public long? CompletedAt { get; set; }
    public bool IsDeleted { get; set; }
}
