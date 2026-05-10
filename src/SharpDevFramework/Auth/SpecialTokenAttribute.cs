namespace SharpDevFramework;

/// <summary>
/// 标记接口允许 Special Token 访问
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class SpecialTokenAttribute : Attribute
{
}
