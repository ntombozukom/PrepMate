using MediatR;

namespace PrepMate.Application.Features.Profile.Commands.ChangePassword;

public record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword) : IRequest<Unit>;
