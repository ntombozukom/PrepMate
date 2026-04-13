using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.CvTools.Commands.GenerateCoverLetter;

public record GenerateCoverLetterCommand(
    Guid CvDocumentId,
    string? JobDescriptionText,
    string? JobTitle,
    string? CompanyName,
    Guid UserId) : IRequest<CoverLetterDto>;
