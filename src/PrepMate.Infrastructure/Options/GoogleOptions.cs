namespace PrepMate.Infrastructure.Options;

public sealed class GoogleOptions
{
    public const string SectionName = "Google";
    public string ClientId { get; set; } = default!;
}
