using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Extensions;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.Cv.Commands.Upload;
using PrepMate.Application.Features.Cv.Queries.GetActive;

namespace PrepMate.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class CvController(IMediator mediator) : ControllerBase
{
    /// <summary>Upload or replace the current user's CV (PDF or Word .docx, max 5 MB).</summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(CvDocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Upload(
        IFormFile file,
        CancellationToken ct)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);

        var command = new UploadCvCommand(
            User.GetUserId(),
            file.FileName,
            ms.ToArray());

        var result = await mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Get the currently active CV for the authenticated user.</summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(CvDocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await mediator.Send(new GetActiveCvQuery(User.GetUserId()), ct);

        return result is null
            ? NotFound(new { message = "No CV uploaded yet." })
            : Ok(result);
    }
}
