using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.CvTools.Commands.OptimizeCvAts;

public record OptimizeCvAtsCommand(
    Guid CvDocumentId,
    Guid UserId) : IRequest<AtsOptimizationDto>;
