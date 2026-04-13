namespace PrepMate.Infrastructure.Options;

public sealed class ClaudeOptions
{
    public const string SectionName = "Claude";

    public string ApiKey { get; set; } = default!;
    public string Model { get; set; } = "claude-opus-4-6";
    public int MaxTokens { get; set; } = 8000;
}
