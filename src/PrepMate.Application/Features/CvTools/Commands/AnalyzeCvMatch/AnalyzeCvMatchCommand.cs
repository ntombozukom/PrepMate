using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.CvTools.Commands.AnalyzeCvMatch;

public record AnalyzeCvMatchCommand(
    Guid CvDocumentId,
    string JobDescriptionText,
    string JobTitle,
    Guid UserId) : IRequest<CvMatchResultDto>;
