using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.Auth.Commands.Register;

public sealed class RegisterUserCommandHandler(
    IUserRepository userRepository,
    ITokenService tokenService,
    IPasswordHasher passwordHasher)
    : IRequestHandler<RegisterUserCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        if (await userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
            throw new ConflictException($"Email '{request.Email}' is already registered.");

        var passwordHash = passwordHasher.Hash(request.Password);
        var user = User.Create(request.Email, passwordHash, request.FirstName, request.LastName);

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        var tokens = tokenService.GenerateTokens(user);

        return new AuthResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email, user.FirstName, user.LastName));
    }
}
