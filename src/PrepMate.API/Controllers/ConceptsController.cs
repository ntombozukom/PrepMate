using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Extensions;
using PrepMate.API.Filters;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.Concepts.Queries.GetBySession;

namespace PrepMate.API.Controllers;

[ApiController]
[Route("api/v1/prep-sessions/{sessionId:guid}/concepts")]
[Authorize]
[RequiresJobPrep]
public sealed class ConceptsController(IMediator mediator) : ControllerBase
{
    /// <summary>Get all concept explanations for a prep session.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ConceptExplanationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySession(Guid sessionId, CancellationToken ct)
    {
        var result = await mediator.Send(
            new GetConceptsBySessionQuery(sessionId, User.GetUserId()), ct);
        return Ok(result);
    }
}
