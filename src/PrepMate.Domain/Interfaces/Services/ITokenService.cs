using PrepMate.Domain.Entities;

namespace PrepMate.Domain.Interfaces.Services;

public record AuthTokens(string AccessToken, string RefreshToken, DateTime ExpiresAt);

public interface ITokenService
{
    AuthTokens GenerateTokens(User user);
    Guid? ValidateRefreshToken(string refreshToken);
}
