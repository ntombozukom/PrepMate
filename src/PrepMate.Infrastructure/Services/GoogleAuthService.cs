using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using PrepMate.Domain.Interfaces.Services;
using PrepMate.Infrastructure.Options;

namespace PrepMate.Infrastructure.Services;

public sealed class GoogleAuthService(IOptions<GoogleOptions> options) : IGoogleAuthService
{
    private readonly GoogleOptions _options = options.Value;

    public async Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken ct = default)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [_options.ClientId]
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

        var firstName = payload.GivenName ?? payload.Name?.Split(' ').FirstOrDefault() ?? "User";
        var lastName = payload.FamilyName ?? payload.Name?.Split(' ').LastOrDefault() ?? "";

        return new GoogleUserInfo(payload.Email, firstName, lastName);
    }
}
