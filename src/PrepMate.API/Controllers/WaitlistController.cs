using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Extensions;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.Waitlist.Commands.JoinJobPrep;
using PrepMate.Application.Features.Waitlist.Queries.GetJobPrepStatus;

namespace PrepMate.API.Controllers;

[ApiController]
[Route("api/v1/waitlist")]
[Authorize]
public sealed class WaitlistController(IMediator mediator) : ControllerBase
{
    /// <summary>Whether the current user asked to be notified when interview prep launches.</summary>
    [HttpGet("job-prep")]
    [ProducesResponseType(typeof(WaitlistStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetJobPrep(CancellationToken ct) =>
        Ok(await mediator.Send(new GetJobPrepWaitlistStatusQuery(User.GetUserId()), ct));

    /// <summary>"Notify me" for interview prep. Safe to call more than once.</summary>
    [HttpPost("job-prep")]
    [ProducesResponseType(typeof(WaitlistStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> JoinJobPrep(CancellationToken ct) =>
        Ok(await mediator.Send(new JoinJobPrepWaitlistCommand(User.GetUserId()), ct));
}
