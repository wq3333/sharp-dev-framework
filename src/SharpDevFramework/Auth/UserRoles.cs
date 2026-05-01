using System.ComponentModel;

namespace SharpDevFramework;

[MockEnum(nameof(UserRoleTypes))]
public class UserRoleTypes
{
    [Description("管理员")]
    public const string Admin = nameof(Admin);
}