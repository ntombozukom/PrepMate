using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Profile.Commands.UpdateProfile;

public record UpdateProfileCommand(
    Guid UserId,
    string FirstName,
    string LastName) : IRequest<UserDto>;
