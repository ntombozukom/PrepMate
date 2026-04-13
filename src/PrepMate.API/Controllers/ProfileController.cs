using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrepMate.API.Extensions;
using PrepMate.Application.DTOs;
using PrepMate.Application.Features.Profile.Commands.ChangePassword;
using PrepMate.Application.Features.Profile.Commands.UpdateProfile;

namespace PrepMate.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class ProfileController(IMediator mediator) : ControllerBase
{
    /// <summary>Get the current user's profile.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        var userId = User.GetUserId();
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? string.Empty;
        var firstName = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.GivenName)?.Value
                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.GivenName)?.Value
                     ?? string.Empty;
        var lastName = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.FamilyName)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Surname)?.Value
                    ?? string.Empty;

        return Ok(new UserDto(userId, email, firstName, lastName));
    }

    /// <summary>Update first and last name.</summary>
    [HttpPut]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(
        [FromBody] UpdateProfileRequest request,
        CancellationToken ct)
    {
        var result = await mediator.Send(
            new UpdateProfileCommand(User.GetUserId(), request.FirstName, request.LastName), ct);
        return Ok(result);
    }

    /// <summary>Change the authenticated user's password.</summary>
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct)
    {
        await mediator.Send(
            new ChangePasswordCommand(User.GetUserId(), request.CurrentPassword, request.NewPassword), ct);
        return NoContent();
    }
}
