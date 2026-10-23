using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Waitlist.Commands.JoinJobPrep;

public record JoinJobPrepWaitlistCommand(Guid UserId) : IRequest<WaitlistStatusDto>;
