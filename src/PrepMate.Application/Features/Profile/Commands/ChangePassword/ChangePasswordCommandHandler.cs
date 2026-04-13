using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.Profile.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher)
    : IRequestHandler<ChangePasswordCommand, Unit>
{
    public async Task<Unit> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        if (!passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        var newHash = passwordHasher.Hash(request.NewPassword);
        user.ChangePassword(newHash);
        await userRepository.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
