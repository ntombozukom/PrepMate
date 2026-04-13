using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.PrepSession.Queries.GetById;

public sealed class GetPrepSessionByIdQueryHandler(IPrepSessionRepository sessionRepository)
    : IRequestHandler<GetPrepSessionByIdQuery, PrepSessionDetailDto>
{
    public async Task<PrepSessionDetailDto> Handle(
        GetPrepSessionByIdQuery request,
        CancellationToken cancellationToken)
    {
        var session = await sessionRepository.GetByIdWithDetailsAsync(request.SessionId, cancellationToken)
            ?? throw new NotFoundException("PrepSession", request.SessionId);

        if (session.UserId != request.UserId)
            throw new UnauthorizedAccessException("Session does not belong to the current user.");

        return new PrepSessionDetailDto(
            session.Id,
            session.JobTitle,
            session.CompanyName,
            session.Industry,
            session.Industry.ToString(),
            session.JobDescriptionText,
            session.CreatedAt,
            session.ConceptExplanations
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
                .ToList());
    }
}
