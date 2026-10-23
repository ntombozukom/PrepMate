namespace PrepMate.Application.DTOs;

public record MatchedSkillDto(string Skill, string Strength, string Evidence);

public record SkillGapDto(string Skill, string Importance, string Tip);

public record CvMatchResultDto(
    string OverallMatch,
    int MatchScore,
    List<MatchedSkillDto> MatchedSkills,
    List<SkillGapDto> SkillGaps,
    string ExperienceAlignment,
    string Recommendation);

public record CoverLetterDto(string CoverLetter, string Tone);

public record AtsOptimizationDto(
    int Score,
    List<string> Strengths,
    List<string> Improvements,
    string RewrittenSummary,
    List<string> KeywordsToAdd,
    string RewrittenCv,
    bool CvWasTruncated);
