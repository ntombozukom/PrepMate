using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using PrepMate.Infrastructure.Options;

namespace PrepMate.API.Filters;

/// <summary>Blocks an endpoint while accounts are switched off ("Features:Accounts" = false).</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequiresAccountsAttribute() : TypeFilterAttribute(typeof(AccountsEnabledFilter));

public sealed class AccountsEnabledFilter(IOptions<FeatureOptions> features) : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (features.Value.Accounts) return;

        context.Result = new NotFoundObjectResult(new
        {
            status = StatusCodes.Status404NotFound,
            title = "Accounts are not available yet. You can check your CV without one.",
        });
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
