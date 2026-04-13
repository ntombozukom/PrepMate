using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.Concepts.Queries.GetBySession;

public sealed class GetConceptsBySessionQueryHandler(
    IConceptExplanationRepository conceptRepository,
    IPrepSessionRepository sessionRepository)
    : IRequestHandler<GetConceptsBySessionQuery, IReadOnlyList<ConceptExplanationDto>>
{
    public async Task<IReadOnlyList<ConceptExplanationDto>> Handle(
        GetConceptsBySessionQuery request,
        CancellationToken cancellationToken)
    {
        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken)
            ?? throw new NotFoundException("PrepSession", request.SessionId);

        if (session.UserId != request.UserId)
            throw new UnauthorizedAccessException("Session does not belong to the current user.");

        var concepts = await conceptRepository.GetBySessionIdAsync(request.SessionId, cancellationToken);

        return concepts
            .OrderBy(c => c.OrderIndex)
            .Select(c => new ConceptExplanationDto(
                c.Id,
                c.Topic,
                c.Question,
                c.PlainEnglishExplanation,
                c.Analogy,
                c.TechnicalDepth,
                c.IndustryContext,
                c.SuggestedAnswer,
                c.Difficulty,
                c.Difficulty.ToString(),
                c.OrderIndex))
            .ToList();
    }
}
