using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.CvTools.Commands.AnalyzeCvMatch;

public sealed class AnalyzeCvMatchCommandHandler(
    ICvDocumentRepository cvRepository,
    IClaudeService claudeService)
    : IRequestHandler<AnalyzeCvMatchCommand, CvMatchResultDto>
{
    public async Task<CvMatchResultDto> Handle(
        AnalyzeCvMatchCommand request,
        CancellationToken cancellationToken)
    {
        var cv = await cvRepository.GetByIdAsync(request.CvDocumentId, cancellationToken)
            ?? throw new NotFoundException("CvDocument", request.CvDocumentId);

        if (cv.UserId != request.UserId)
            throw new UnauthorizedAccessException("CV does not belong to the current user.");

        var matchRequest = new CvMatchRequest(
            cv.ExtractedText,
            request.JobDescriptionText,
            request.JobTitle);

        var result = await claudeService.AnalyzeCvMatchAsync(matchRequest, cancellationToken);

        return new CvMatchResultDto(
            result.OverallMatch,
            result.MatchScore,
            result.MatchedSkills.Select(s => new MatchedSkillDto(s.Skill, s.Strength, s.Evidence)).ToList(),
            result.SkillGaps.Select(g => new SkillGapDto(g.Skill, g.Importance, g.Tip)).ToList(),
            result.ExperienceAlignment,
            result.Recommendation);
    }
}
