using System.ComponentModel;

namespace SharpDevFramework.Demo.Enums;

[MockEnum("UserRoleTypes")]
public class UserRoleTypesExtend
{
    [Description("程序员")]
    public const string Programmer = nameof(Programmer);
}
