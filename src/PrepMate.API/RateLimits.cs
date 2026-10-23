using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace PrepMate.API;

/// <summary>
/// Limits on the open (no-account) AI endpoints, so a single visitor can't run up AI costs.
/// Keyed by client IP; behind Cloudflare the real IP is in CF-Connecting-IP.
/// </summary>
public static class RateLimits
{
    public const string AiPolicy = "ai";

    public static IServiceCollection AddAiRateLimit(this IServiceCollection services, IConfiguration config)
    {
        var perHour = config.GetValue("RateLimits:AiRequestsPerHour", 10);

        return services.AddRateLimiter(opts =>
        {
            opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            opts.OnRejected = async (ctx, ct) =>
            {
                ctx.HttpContext.Response.ContentType = "application/json";
                await ctx.HttpContext.Response.WriteAsJsonAsync(new
                {
                    status = 429,
                    title = "You've reached the limit for now. Please try again in an hour.",
                }, ct);
            };

            opts.AddPolicy(AiPolicy, http =>
            {
                var ip = http.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
                         ?? http.Connection.RemoteIpAddress?.ToString()
                         ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = perHour,
                    Window = TimeSpan.FromHours(1),
                    QueueLimit = 0,
                });
            });
        });
    }
}
