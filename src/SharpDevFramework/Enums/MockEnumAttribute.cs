namespace SharpDevFramework;

[AttributeUsage(AttributeTargets.Class)]
public class MockEnumAttribute(string mockEnumName) : Attribute
{
    public string MockEnumName { get; } = mockEnumName;
}