namespace SharpDevFramework;

/// <summary>
/// 模拟枚举特性，用于将类标记为模拟枚举
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class MockEnumAttribute(string mockEnumName) : Attribute
{
    /// <summary>
    /// 模拟的枚举名称
    /// </summary>
    public string MockEnumName { get; } = mockEnumName;
}