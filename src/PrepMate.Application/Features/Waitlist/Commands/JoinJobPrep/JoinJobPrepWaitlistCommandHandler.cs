using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.Waitlist.Commands.JoinJobPrep;

public sealed class JoinJobPrepWaitlistCommandHandler(IUserRepository userRepository)
    : IRequestHandler<JoinJobPrepWaitlistCommand, WaitlistStatusDto>
{
    public async Task<WaitlistStatusDto> Handle(JoinJobPrepWaitlistCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        user.JoinJobPrepWaitlist();
        await userRepository.SaveChangesAsync(cancellationToken);

        return new WaitlistStatusDto(true, user.JobPrepWaitlistJoinedAt);
    }
}
