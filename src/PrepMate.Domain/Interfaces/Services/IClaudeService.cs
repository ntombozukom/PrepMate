using PrepMate.Domain.Enums;

namespace PrepMate.Domain.Interfaces.Services;

public record ConceptExplanationRequest(
    string JobDescriptionText,
    string CvText,
    Industry Industry,
    string JobTitle);

public record GeneratedConcept(
    string Topic,
    string Question,
    string PlainEnglishExplanation,
    string Analogy,
    string TechnicalDepth,
    string IndustryContext,
    string SuggestedAnswer,
    DifficultyLevel Difficulty);

public record JdAnalysis(
    string JobTitle,
    string? CompanyName,
    Industry Industry);

// ── CV Tools ──────────────────────────────────────────────────────────────────

public record CvMatchRequest(string CvText, string JobDescriptionText, string JobTitle);

public record MatchedSkill(string Skill, string Strength, string Evidence);

public record SkillGap(string Skill, string Importance, string Tip);

public record CvMatchResult(
    string OverallMatch,
    int MatchScore,
    List<MatchedSkill> MatchedSkills,
    List<SkillGap> SkillGaps,
    string ExperienceAlignment,
    string Recommendation);

public record CoverLetterRequest(
    string CvText,
    string? JobDescriptionText,
    string? JobTitle,
    string? CompanyName);

public record CoverLetterResult(string CoverLetter, string Tone);

public record AtsOptimizationResult(
    int Score,
    List<string> Strengths,
    List<string> Improvements,
    string RewrittenSummary,
    List<string> KeywordsToAdd,
    string RewrittenCv = "",
    bool CvWasTruncated = false);

// ── Interface ──────────────────────────────────────────────────────────────────

public interface IClaudeService
{
    Task<IReadOnlyList<GeneratedConcept>> GenerateConceptExplanationsAsync(
        ConceptExplanationRequest request,
        CancellationToken ct = default);

    Task<IReadOnlyList<string>> GenerateInterviewQuestionsAsync(
        ConceptExplanationRequest request,
        CancellationToken ct = default);

    Task<JdAnalysis> AnalyzeJobDescriptionAsync(
        string jobDescriptionText,
        CancellationToken ct = default);

    Task<CvMatchResult> AnalyzeCvMatchAsync(
        CvMatchRequest request,
        CancellationToken ct = default);

    Task<CoverLetterResult> GenerateCoverLetterAsync(
        CoverLetterRequest request,
        CancellationToken ct = default);

    Task<AtsOptimizationResult> OptimizeCvAtsAsync(
        string cvText,
        CancellationToken ct = default);
}
