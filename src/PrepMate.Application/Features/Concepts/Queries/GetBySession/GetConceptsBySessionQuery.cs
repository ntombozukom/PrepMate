using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Concepts.Queries.GetBySession;

public record GetConceptsBySessionQuery(Guid SessionId, Guid UserId) : IRequest<IReadOnlyList<ConceptExplanationDto>>;
