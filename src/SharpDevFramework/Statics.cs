using SharpDevLib;

namespace SharpDevFramework;

public static class Statics
{
    static Statics()
    {
        if (!Directory.Exists(DatabaseDirectory)) Directory.CreateDirectory(DatabaseDirectory);
        if (!Directory.Exists(LogsDirectory)) Directory.CreateDirectory(LogsDirectory);
        if (!Directory.Exists(TempDirectory)) Directory.CreateDirectory(TempDirectory);
    }

    public static readonly string RootDirectory = AppDomain.CurrentDomain.BaseDirectory;
    public static readonly string DataDirectory = RootDirectory.CombinePath("data");
    public static readonly string DatabaseDirectory = DataDirectory.CombinePath("db");
    public static readonly string LogsDirectory = DataDirectory.CombinePath("logs");
    public static readonly string TempDirectory = DataDirectory.CombinePath("temp");

    public static readonly string DatabasePath = DatabaseDirectory.CombinePath("database.db");
    public static readonly string LogsPath = LogsDirectory.CombinePath("logs-.txt");
    public static readonly string JwtSecretPath = DatabaseDirectory.CombinePath("jwt-secret.txt");
    public static readonly string InitAuthPath = DatabaseDirectory.CombinePath("auth.txt");
}