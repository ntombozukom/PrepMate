using PrepMate.Domain.Common;
using PrepMate.Domain.Enums;

namespace PrepMate.Domain.Entities;

public sealed class PrepSession : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid CvDocumentId { get; private set; }
    public string JobDescriptionText { get; private set; } = default!;
    public string JobTitle { get; private set; } = default!;
    public string? CompanyName { get; private set; }
    public Industry Industry { get; private set; }

    // Navigation
    public User User { get; private set; } = default!;
    public CvDocument CvDocument { get; private set; } = default!;
    public IReadOnlyCollection<ConceptExplanation> ConceptExplanations => _conceptExplanations.AsReadOnly();

    private readonly List<ConceptExplanation> _conceptExplanations = [];

    private PrepSession() { } // EF Core

    public void AddConcept(ConceptExplanation concept)
    {
        ArgumentNullException.ThrowIfNull(concept);
        _conceptExplanations.Add(concept);
        SetUpdated();
    }

    public static PrepSession Create(
        Guid userId,
        Guid cvDocumentId,
        string jobDescriptionText,
        string jobTitle,
        Industry industry,
        string? companyName = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(jobDescriptionText);
        ArgumentException.ThrowIfNullOrWhiteSpace(jobTitle);

        return new PrepSession
        {
            UserId = userId,
            CvDocumentId = cvDocumentId,
            JobDescriptionText = jobDescriptionText.Trim(),
            JobTitle = jobTitle.Trim(),
            CompanyName = companyName?.Trim(),
            Industry = industry
        };
    }
}
