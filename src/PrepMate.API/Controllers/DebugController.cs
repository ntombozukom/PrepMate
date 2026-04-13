using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PrepMate.Infrastructure.Options;

namespace PrepMate.API.Controllers;

/// <summary>
/// Temporary debug controller — remove before production.
/// </summary>
[ApiController]
[Route("api/v1/debug")]
[Authorize]
public sealed class DebugController(
    IHttpClientFactory httpClientFactory,
    IOptions<GroqOptions> groqOptions) : ControllerBase
{
    [HttpGet("ping-ai")]
    public async Task<IActionResult> PingAi(CancellationToken ct)
    {
        var opts = groqOptions.Value;
        using var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", opts.ApiKey);

        var body = JsonSerializer.Serialize(new
        {
            model = opts.Model,
            max_tokens = 200,
            messages = new[]
            {
                new { role = "user", content = "Reply with exactly this JSON and nothing else: [\"hello\"]" }
            }
        });

        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://api.groq.com/openai/v1/chat/completions", content, ct);

        var raw = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = raw });

        using var doc = JsonDocument.Parse(raw);
        var text = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return Ok(new { status = "ok", modelReply = text, rawResponse = raw[..Math.Min(raw.Length, 500)] });
    }
}
