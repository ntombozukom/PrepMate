using MediatR;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandHandler(
    IUserRepository userRepository,
    ITokenService tokenService,
    IGoogleAuthService googleAuthService)
    : IRequestHandler<GoogleLoginCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var payload = await googleAuthService.VerifyIdTokenAsync(request.IdToken, cancellationToken);

        var user = await userRepository.GetByEmailAsync(payload.Email, cancellationToken);

        if (user is null)
        {
            // Auto-register on first Google sign-in — no password needed
            var passwordHash = Guid.NewGuid().ToString(); // unusable placeholder
            user = User.Create(payload.Email, passwordHash, payload.FirstName, payload.LastName);
            await userRepository.AddAsync(user, cancellationToken);
            await userRepository.SaveChangesAsync(cancellationToken);
        }

        var tokens = tokenService.GenerateTokens(user);

        return new AuthResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email, user.FirstName, user.LastName));
    }
}
