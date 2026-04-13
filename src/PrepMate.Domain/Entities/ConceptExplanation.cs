using PrepMate.Domain.Common;
using PrepMate.Domain.Enums;

namespace PrepMate.Domain.Entities;

public sealed class ConceptExplanation : BaseEntity
{
    public Guid PrepSessionId { get; private set; }
    public string Topic { get; private set; } = default!;
    public string Question { get; private set; } = default!;
    public string PlainEnglishExplanation { get; private set; } = default!;
    public string? Analogy { get; private set; }
    public string? TechnicalDepth { get; private set; }
    public string? IndustryContext { get; private set; }
    public string? SuggestedAnswer { get; private set; }
    public DifficultyLevel Difficulty { get; private set; }
    public int OrderIndex { get; private set; }

    // Navigation
    public PrepSession PrepSession { get; private set; } = default!;

    private ConceptExplanation() { } // EF Core

    public static ConceptExplanation Create(
        Guid prepSessionId,
        string topic,
        string question,
        string plainEnglishExplanation,
        DifficultyLevel difficulty,
        int orderIndex,
        string? analogy = null,
        string? technicalDepth = null,
        string? industryContext = null,
        string? suggestedAnswer = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(topic);
        ArgumentException.ThrowIfNullOrWhiteSpace(question);
        ArgumentException.ThrowIfNullOrWhiteSpace(plainEnglishExplanation);

        return new ConceptExplanation
        {
            PrepSessionId = prepSessionId,
            Topic = topic.Trim(),
            Question = question.Trim(),
            PlainEnglishExplanation = plainEnglishExplanation.Trim(),
            Analogy = analogy?.Trim(),
            TechnicalDepth = technicalDepth?.Trim(),
            IndustryContext = industryContext?.Trim(),
            SuggestedAnswer = suggestedAnswer?.Trim(),
            Difficulty = difficulty,
            OrderIndex = orderIndex
        };
    }
}
