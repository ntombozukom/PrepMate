using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Filters;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.Auth.Commands.GoogleLogin;
using PrepMate.Application.Features.Auth.Commands.Login;
using PrepMate.Application.Features.Auth.Commands.Register;

namespace PrepMate.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[RequiresAccounts]
public sealed class AuthController(IMediator mediator) : ControllerBase
{
    /// <summary>Register a new user account.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var command = new RegisterUserCommand(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName);

        var result = await mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Sign in or register via Google OAuth ID token.</summary>
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Google([FromBody] GoogleLoginRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new GoogleLoginCommand(request.IdToken), ct);
        return Ok(result);
    }

    /// <summary>Authenticate and obtain tokens.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var command = new LoginUserCommand(request.Email, request.Password);
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }
}
