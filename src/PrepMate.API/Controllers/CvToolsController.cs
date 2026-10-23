using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Filters;
using PrepMate.API.Extensions;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.CvTools.Commands.AnalyzeCvMatch;
using PrepMate.Application.Features.CvTools.Commands.GenerateCoverLetter;
using PrepMate.Application.Features.CvTools.Commands.OptimizeCvAts;

namespace PrepMate.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class CvToolsController(IMediator mediator) : ControllerBase
{
    /// <summary>Analyse how well the candidate's CV matches a job description.</summary>
    [HttpPost("match-analysis")]
    [RequiresJobPrep]
    [ProducesResponseType(typeof(CvMatchResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AnalyzeMatch(
        [FromBody] MatchAnalysisRequest body,
        CancellationToken ct)
    {
        var command = new AnalyzeCvMatchCommand(
            body.CvDocumentId,
            body.JobDescriptionText,
            body.JobTitle,
            User.GetUserId());

        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    /// <summary>Generate a cover letter based on the CV, optionally tailored to a specific JD.</summary>
    [HttpPost("cover-letter")]
    [ProducesResponseType(typeof(CoverLetterDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateCoverLetter(
        [FromBody] CoverLetterGenerateRequest body,
        CancellationToken ct)
    {
        var command = new GenerateCoverLetterCommand(
            body.CvDocumentId,
            body.JobDescriptionText,
            body.JobTitle,
            body.CompanyName,
            User.GetUserId());

        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    /// <summary>Analyse the CV for ATS compatibility and return improvement suggestions.</summary>
    [HttpPost("ats-optimize")]
    [ProducesResponseType(typeof(AtsOptimizationDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> OptimizeAts(
        [FromBody] AtsOptimizeRequest body,
        CancellationToken ct)
    {
        var command = new OptimizeCvAtsCommand(body.CvDocumentId, User.GetUserId());
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }
}

public record MatchAnalysisRequest(Guid CvDocumentId, string JobDescriptionText, string JobTitle);
public record CoverLetterGenerateRequest(Guid CvDocumentId, string? JobDescriptionText, string? JobTitle, string? CompanyName);
public record AtsOptimizeRequest(Guid CvDocumentId);
