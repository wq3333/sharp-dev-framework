namespace SharpDevFramework.Demo.Enums;

[TaskTypesEnum]
public class TaskTypesExtend
{
    public static readonly TaskTypes Encrypt = new(nameof(Encrypt), "加密");
}
