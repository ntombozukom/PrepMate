namespace PrepMate.Infrastructure.Options;

/// <summary>
/// Switches for features that are built but not yet launched.
/// Flip them in appsettings ("Features": { "JobPrep": true }) without a code change.
/// </summary>
public sealed class FeatureOptions
{
    public const string SectionName = "Features";

    /// <summary>Interview prep: prep sessions, concepts and CV-to-JD match analysis.</summary>
    public bool JobPrep { get; init; }

    /// <summary>
    /// Sign-up, sign-in and saved CVs. Off = the no-account ATS check and cover letter only,
    /// where nothing is stored.
    /// </summary>
    public bool Accounts { get; init; }
}
