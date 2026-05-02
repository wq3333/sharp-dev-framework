using System.ComponentModel;

namespace SharpDevFramework;

/// <summary>
/// 用户角色类型（模拟枚举）
/// </summary>
[MockEnum(nameof(UserRoleTypes))]
public class UserRoleTypes
{
    /// <summary>
    /// 管理员角色
    /// </summary>
    [Description("管理员")]
    public const string Admin = nameof(Admin);
}