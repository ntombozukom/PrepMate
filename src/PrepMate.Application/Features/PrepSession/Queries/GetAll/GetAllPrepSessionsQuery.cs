using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.PrepSession.Queries.GetAll;

public record GetAllPrepSessionsQuery(Guid UserId) : IRequest<IReadOnlyList<PrepSessionDto>>;
