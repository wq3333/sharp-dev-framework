using SharpDevFramework;
using SharpDevFramework.Demo.Data;
using System.Reflection;

Assembly[] assemblies = [Assembly.GetExecutingAssembly()];

var builder = WebApplication.CreateBuilder(args);
builder.AddSharpDevFramework<AppDbContext>(assemblies);

var app = builder.Build();
app.UseSharpDevFramework(assemblies);
app.Run();
