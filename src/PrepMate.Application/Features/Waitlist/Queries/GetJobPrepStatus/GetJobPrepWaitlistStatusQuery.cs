using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Waitlist.Queries.GetJobPrepStatus;

public record GetJobPrepWaitlistStatusQuery(Guid UserId) : IRequest<WaitlistStatusDto>;
