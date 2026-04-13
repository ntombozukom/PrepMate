using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;
using PrepMateSession = PrepMate.Domain.Entities.PrepSession;
using PrepMateConcept = PrepMate.Domain.Entities.ConceptExplanation;
using PrepMateCv = PrepMate.Domain.Entities.CvDocument;

namespace PrepMate.Application.Features.PrepSession.Commands.Create;

public sealed class CreatePrepSessionCommandHandler(
    IPrepSessionRepository sessionRepository,
    ICvDocumentRepository cvRepository,
    IClaudeService claudeService)
    : IRequestHandler<CreatePrepSessionCommand, PrepSessionDetailDto>
{
    public async Task<PrepSessionDetailDto> Handle(
        CreatePrepSessionCommand request,
        CancellationToken cancellationToken)
    {
        var cv = await cvRepository.GetByIdAsync(request.CvDocumentId, cancellationToken)
            ?? throw new NotFoundException(nameof(PrepMateCv), request.CvDocumentId);

        if (cv.UserId != request.UserId)
            throw new UnauthorizedAccessException("CV does not belong to the current user.");

        var session = PrepMateSession.Create(
            request.UserId,
            request.CvDocumentId,
            request.JobDescriptionText,
            request.JobTitle,
            request.Industry,
            request.CompanyName);

        await sessionRepository.AddAsync(session, cancellationToken);

        // Generate AI explanations before final save
        var aiRequest = new ConceptExplanationRequest(
            request.JobDescriptionText,
            cv.ExtractedText,
            request.Industry,
            request.JobTitle);

        var generatedConcepts = await claudeService.GenerateConceptExplanationsAsync(aiRequest, cancellationToken);

        foreach (var (concept, index) in generatedConcepts.Select((c, i) => (c, i)))
        {
            var entity = PrepMateConcept.Create(
                session.Id,
                concept.Topic,
                concept.Question,
                concept.PlainEnglishExplanation,
                concept.Difficulty,
                index + 1,
                concept.Analogy,
                concept.TechnicalDepth,
                concept.IndustryContext,
                concept.SuggestedAnswer);

            session.AddConcept(entity);
        }

        await sessionRepository.SaveChangesAsync(cancellationToken);

        return MapToDetailDto(session);
    }

    private static PrepSessionDetailDto MapToDetailDto(PrepMateSession session) =>
        new(
            session.Id,
            session.JobTitle,
            session.CompanyName,
            session.Industry,
            session.Industry.ToString(),
            session.JobDescriptionText,
            session.CreatedAt,
            session.ConceptExplanations.Select(c => new ConceptExplanationDto(
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
                c.OrderIndex)).ToList());
}
