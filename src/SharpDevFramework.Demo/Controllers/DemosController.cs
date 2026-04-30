using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharpDevFramework.Demo.Data;
using SharpDevFramework.Demo.Data.Entities;
using SharpDevLib;

namespace SharpDevFramework.Demo.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DemosController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public PageReply<DemoDto> GetPage([FromQuery] DemoPageRequest request)
    {
        var query = context.Demos.Where(x => !x.IsDeleted);
        if (request.Name.NotNullOrWhiteSpace()) query = query.Where(x => x.Name.Contains(request.Name));
        if (request.Status.NotNullOrWhiteSpace()) query = query.Where(x => request.Status.Split(',').Contains(x.Status));
        if (request.Category.NotNullOrWhiteSpace()) query = query.Where(x => x.Category == request.Category);
        var total = query.Count();
        var items = query.OrderByDescending(x => x.CreatedAt).Skip((request.Index - 1) * request.Size).Take(request.Size).ToList();
        return PageReply.Succeed(items.Adapt<List<DemoDto>>(), total, request);
    }

    [HttpGet("{id}")]
    public DataReply<DemoDto> Get(int id)
    {
        var demo = context.Demos.Find(id) ?? throw new Exception("data not found");
        return DataReply.Succeed(demo.Adapt<DemoDto>());
    }

    [HttpPost]
    public EmptyReply Create([FromBody] CreateDemoRequest request)
    {
        if (request.Name.IsNullOrWhiteSpace()) throw new Exception("名称不能为空");
        if (context.Demos.Any(x => x.Name == request.Name && !x.IsDeleted)) throw new Exception("名称已存在");

        var demo = new DemoEntity
        {
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            Category = request.Category
        };
        context.Demos.Add(demo);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }

    [HttpPut("{id}")]
    public EmptyReply Update(int id, [FromBody] UpdateDemoRequest request)
    {
        var demo = context.Demos.Find(id) ?? throw new Exception("data not found");
        if (request.Name.NotNullOrWhiteSpace() && request.Name != demo.Name)
        {
            if (context.Demos.Any(x => x.Name == request.Name && x.Id != id && !x.IsDeleted)) throw new Exception("名称已存在");
            demo.Name = request.Name;
        }
        demo.Description = request.Description;
        demo.Status = request.Status;
        demo.Category = request.Category;
        demo.UpdatedAt = DateTime.Now.ToUtcTimestamp();
        context.Demos.Update(demo);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }

    [HttpDelete("{id}")]
    public EmptyReply Delete(int id)
    {
        var demo = context.Demos.Find(id) ?? throw new Exception("data not found");
        demo.IsDeleted = true;
        context.Demos.Update(demo);
        context.SaveChanges();
        return EmptyReply.Succeed();
    }
}

public class DemoPageRequest : PageRequest
{
    public string? Name { get; set; }
    public string? Status { get; set; }
    public string? Category { get; set; }
}

public class CreateDemoRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Active";
    public string? Category { get; set; }
}

public class UpdateDemoRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Category { get; set; }
}

public class DemoDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Category { get; set; }
    public long CreatedAt { get; set; }
    public long? UpdatedAt { get; set; }
}