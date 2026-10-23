using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.CvTools.Commands.OptimizeCvAts;

public sealed class OptimizeCvAtsCommandHandler(
    ICvDocumentRepository cvRepository,
    IClaudeService claudeService)
    : IRequestHandler<OptimizeCvAtsCommand, AtsOptimizationDto>
{
    public async Task<AtsOptimizationDto> Handle(
        OptimizeCvAtsCommand request,
        CancellationToken cancellationToken)
    {
        var cv = await cvRepository.GetByIdAsync(request.CvDocumentId, cancellationToken)
            ?? throw new NotFoundException("CvDocument", request.CvDocumentId);

        if (cv.UserId != request.UserId)
            throw new UnauthorizedAccessException("CV does not belong to the current user.");

        var result = await claudeService.OptimizeCvAtsAsync(cv.ExtractedText, cancellationToken);

        return new AtsOptimizationDto(
            result.Score,
            result.Strengths,
            result.Improvements,
            result.RewrittenSummary,
            result.KeywordsToAdd,
            result.RewrittenCv,
            result.CvWasTruncated);
    }
}
