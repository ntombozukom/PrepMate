using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.Profile.Commands.UpdateProfile;

public sealed class UpdateProfileCommandHandler(IUserRepository userRepository)
    : IRequestHandler<UpdateProfileCommand, UserDto>
{
    public async Task<UserDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        user.UpdateProfile(request.FirstName, request.LastName);
        await userRepository.SaveChangesAsync(cancellationToken);

        return new UserDto(user.Id, user.Email, user.FirstName, user.LastName);
    }
}
