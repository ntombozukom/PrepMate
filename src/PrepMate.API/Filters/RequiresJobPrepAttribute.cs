using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using PrepMate.Infrastructure.Options;

namespace PrepMate.API.Filters;

/// <summary>
/// Blocks an endpoint while interview prep is switched off ("Features:JobPrep" = false),
/// returning 404 with the same error shape as the rest of the API.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequiresJobPrepAttribute() : TypeFilterAttribute(typeof(JobPrepEnabledFilter));

public sealed class JobPrepEnabledFilter(IOptions<FeatureOptions> features) : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (features.Value.JobPrep) return;

        context.Result = new NotFoundObjectResult(new
        {
            status = StatusCodes.Status404NotFound,
            title = "Interview prep is coming soon.",
        });
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
