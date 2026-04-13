using MediatR;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Enums;

namespace PrepMate.Application.Features.PrepSession.Commands.Create;

public record CreatePrepSessionCommand(
    Guid UserId,
    Guid CvDocumentId,
    string JobDescriptionText,
    string JobTitle,
    Industry Industry,
    string? CompanyName) : IRequest<PrepSessionDetailDto>;
