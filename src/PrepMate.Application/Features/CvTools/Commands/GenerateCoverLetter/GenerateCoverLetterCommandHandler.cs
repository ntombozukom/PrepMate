using MediatR;
using PrepMate.Application.Common.Exceptions;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.CvTools.Commands.GenerateCoverLetter;

public sealed class GenerateCoverLetterCommandHandler(
    ICvDocumentRepository cvRepository,
    IClaudeService claudeService)
    : IRequestHandler<GenerateCoverLetterCommand, CoverLetterDto>
{
    public async Task<CoverLetterDto> Handle(
        GenerateCoverLetterCommand request,
        CancellationToken cancellationToken)
    {
        var cv = await cvRepository.GetByIdAsync(request.CvDocumentId, cancellationToken)
            ?? throw new NotFoundException("CvDocument", request.CvDocumentId);

        if (cv.UserId != request.UserId)
            throw new UnauthorizedAccessException("CV does not belong to the current user.");

        var letterRequest = new CoverLetterRequest(
            cv.ExtractedText,
            request.JobDescriptionText,
            request.JobTitle,
            request.CompanyName);

        var result = await claudeService.GenerateCoverLetterAsync(letterRequest, cancellationToken);

        return new CoverLetterDto(result.CoverLetter, result.Tone);
    }
}
