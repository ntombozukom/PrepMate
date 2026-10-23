using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.Waitlist.Queries.GetJobPrepStatus;

public sealed class GetJobPrepWaitlistStatusQueryHandler(IUserRepository userRepository)
    : IRequestHandler<GetJobPrepWaitlistStatusQuery, WaitlistStatusDto>
{
    public async Task<WaitlistStatusDto> Handle(GetJobPrepWaitlistStatusQuery request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        return new WaitlistStatusDto(user.JobPrepWaitlistJoinedAt is not null, user.JobPrepWaitlistJoinedAt);
    }
}
