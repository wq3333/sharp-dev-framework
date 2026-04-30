using Microsoft.Extensions.Configuration;
using SharpDevLib;

namespace SharpDevFramework;

public class TokenService(IConfiguration configuration) : ISingletonService
{
    int? _expire = null;
    byte[]? _secret = null;

    (int, byte[]) GetConfig()
    {
        if (_expire is null)
        {
            _expire = configuration.GetValue<int>("FrameworkSettings:JwtExpirationMinutes");
            if (_expire <= 0) _expire = 120;
        }
        if (_secret.IsNullOrEmpty())
        {
            if (!File.Exists(Statics.JwtSecretPath)) File.WriteAllText(Statics.JwtSecretPath, RandomHelper.GenerateCode(RandomType.Mix, 255));
            _secret = File.ReadAllText(Statics.JwtSecretPath).Utf8Decode();
        }
        return (_expire.Value, _secret);
    }

    public string GenerateToken(int userId, string username, string role)
    {
        var (expire, secret) = GetConfig();
        var payload = new JwtPayload
        {
            UserId = userId,
            Username = username,
            Role = role,
            Exp = DateTimeOffset.UtcNow.AddMinutes(expire).ToUnixTimeSeconds(),
        };
        return JwtHelper.CreateWithHmacSha256(payload, secret);
    }

    public JwtPayload VerifyToken(string token)
    {
        var (_, secret) = GetConfig();
        var result = JwtHelper.VerifyWithHmacSha256(token, secret);
        if (!result.IsVerified) throw new Exception("token is invalid");
        var payload = result.Payload?.DeSerialize<JwtPayload>() ?? throw new Exception("token is invalid");
        var expTime = DateTimeOffset.FromUnixTimeSeconds(payload.Exp);
        if (expTime < DateTimeOffset.UtcNow) throw new Exception("token is invalid");
        return payload;
    }
}
