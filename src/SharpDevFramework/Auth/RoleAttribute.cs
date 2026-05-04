namespace SharpDevFramework;

/// <summary>
/// 指定角色权限
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RoleAttribute(string[] roles) : Attribute
{
    /// <summary>
    /// 角色集合
    /// </summary>
    public string[] Roles { get; } = roles;
}
