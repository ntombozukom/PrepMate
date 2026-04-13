using PrepMate.Domain.Enums;

namespace PrepMate.Application.DTOs;

public record ConceptExplanationDto(
    Guid Id,
    string Topic,
    string Question,
    string PlainEnglishExplanation,
    string? Analogy,
    string? TechnicalDepth,
    string? IndustryContext,
    string? SuggestedAnswer,
    DifficultyLevel Difficulty,
    string DifficultyName,
    int OrderIndex);
