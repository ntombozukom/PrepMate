using MediatR;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.PrepSession.Queries.GetAll;

public sealed class GetAllPrepSessionsQueryHandler(IPrepSessionRepository sessionRepository)
    : IRequestHandler<GetAllPrepSessionsQuery, IReadOnlyList<PrepSessionDto>>
{
    public async Task<IReadOnlyList<PrepSessionDto>> Handle(
        GetAllPrepSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await sessionRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        return sessions
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new PrepSessionDto(
                s.Id,
                s.JobTitle,
                s.CompanyName,
                s.Industry,
                s.Industry.ToString(),
                s.CreatedAt,
                s.ConceptExplanations.Count))
            .ToList();
    }
}
