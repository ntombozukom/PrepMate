using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.Auth.Commands.Login;

public sealed class LoginUserCommandHandler(
    IUserRepository userRepository,
    ITokenService tokenService,
    IPasswordHasher passwordHasher)
    : IRequestHandler<LoginUserCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new NotFoundException("User", request.Email);

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var tokens = tokenService.GenerateTokens(user);

        return new AuthResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email, user.FirstName, user.LastName));
    }
}
