using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.PrepSession.Queries.GetById;

public record GetPrepSessionByIdQuery(Guid SessionId, Guid UserId) : IRequest<PrepSessionDetailDto>;
