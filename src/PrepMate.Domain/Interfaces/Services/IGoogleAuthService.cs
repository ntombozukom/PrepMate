namespace PrepMate.Domain.Interfaces.Services;

public record GoogleUserInfo(string Email, string FirstName, string LastName);

public interface IGoogleAuthService
{
    Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken ct = default);
}
