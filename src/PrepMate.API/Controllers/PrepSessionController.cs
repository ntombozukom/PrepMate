using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Extensions;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.PrepSession.Commands.Create;
using PrepMate.Application.Features.PrepSession.Queries.GetAll;
using PrepMate.Application.Features.PrepSession.Queries.GetById;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.API.Controllers;

public sealed record AnalyzeJdRequest(string JobDescriptionText);

[ApiController]
[Route("api/v1/prep-sessions")]
[Authorize]
public sealed class PrepSessionController(
    IMediator mediator,
    IPdfExtractorService pdfExtractor,
    IClaudeService aiService) : ControllerBase
{
    /// <summary>
    /// Create a prep session: supply JD + CV + industry, get AI-powered concept explanations back.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PrepSessionDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePrepSessionRequest request,
        CancellationToken ct)
    {
        var command = new CreatePrepSessionCommand(
            User.GetUserId(),
            request.CvDocumentId,
            request.JobDescriptionText,
            request.JobTitle,
            request.Industry,
            request.CompanyName);

        var result = await mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Analyse JD text to extract job title, company name, and industry.</summary>
    [HttpPost("analyze-jd")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> AnalyzeJd([FromBody] AnalyzeJdRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.JobDescriptionText))
            return BadRequest("Job description text is required.");

        var result = await aiService.AnalyzeJobDescriptionAsync(request.JobDescriptionText, ct);
        return Ok(new
        {
            jobTitle = result.JobTitle,
            companyName = result.CompanyName,
            industry = (int)result.Industry,
        });
    }

    /// <summary>Extract plain text from an uploaded JD file (PDF or TXT).</summary>
    [HttpPost("extract-jd-text")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExtractJdText(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
            return BadRequest("File is empty.");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        string text;
        if (file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            text = pdfExtractor.ExtractText(bytes);
        else
            text = System.Text.Encoding.UTF8.GetString(bytes);

        return Ok(new { text });
    }

    /// <summary>List all prep sessions for the current user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PrepSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAllPrepSessionsQuery(User.GetUserId()), ct);
        return Ok(result);
    }

    /// <summary>Get full detail (including all concept explanations) for a session.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PrepSessionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPrepSessionByIdQuery(id, User.GetUserId()), ct);
        return Ok(result);
    }
}
