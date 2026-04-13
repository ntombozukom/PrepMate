using System.Net;
using System.Text.Json;
using PrepMate.Application.Common.Exceptions;

namespace PrepMate.API.Middleware;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException ex)
        {
            // Client disconnected or request timed out — not a real server error.
            // Check the exception's own token OR the request abort token; both indicate
            // a cancelled request rather than a bug in our code.
            if (ex.CancellationToken.IsCancellationRequested || context.RequestAborted.IsCancellationRequested)
            {
                context.Response.StatusCode = 499;
                return;
            }
            // Cancellation from an unexpected source — treat as an error.
            logger.LogError(ex, "Unexpected cancellation: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, errors) = exception switch
        {
            ValidationException ve => (
                HttpStatusCode.UnprocessableEntity,
                "Validation failed",
                (object)ve.Errors),

            NotFoundException nfe => (
                HttpStatusCode.NotFound,
                nfe.Message,
                (object)new { }),

            ConflictException ce => (
                HttpStatusCode.Conflict,
                ce.Message,
                (object)new { }),

            UnauthorizedAccessException ue => (
                HttpStatusCode.Unauthorized,
                ue.Message,
                (object)new { }),

            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred.",
                (object)new { })
        };

        var response = new
        {
            type = $"https://httpstatuses.com/{(int)statusCode}",
            title,
            status = (int)statusCode,
            errors
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
