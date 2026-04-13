namespace PrepMate.Infrastructure.Options;

public sealed class GroqOptions
{
    public const string SectionName = "Groq";
    public string ApiKey { get; init; } = string.Empty;
    public string Model { get; init; } = "llama-3.3-70b-versatile";
    public int MaxTokens { get; init; } = 8000;
}
