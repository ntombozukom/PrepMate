using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Cv.Queries.GetActive;

public record GetActiveCvQuery(Guid UserId) : IRequest<CvDocumentDto?>;
