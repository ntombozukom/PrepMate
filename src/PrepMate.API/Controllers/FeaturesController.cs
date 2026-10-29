using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PrepMate.Infrastructure.Options;

namespace PrepMate.API.Controllers;

public sealed record FeaturesDto(bool JobPrep, bool Accounts);

[ApiController]
[Route("api/v1/features")]
[AllowAnonymous]
public sealed class FeaturesController(IOptions<FeatureOptions> features) : ControllerBase
{
    /// <summary>Which features are switched on, so the client can show or hide them.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(FeaturesDto), StatusCodes.Status200OK)]
    public IActionResult Get() => Ok(new FeaturesDto(features.Value.JobPrep, features.Value.Accounts));
}
