using PrepMate.Domain.Common;

namespace PrepMate.Domain.Entities;

public sealed class User : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;

    /// <summary>When the user asked to be told about interview prep (null = not on the waitlist).</summary>
    public DateTime? JobPrepWaitlistJoinedAt { get; private set; }

    // Navigation
    public IReadOnlyCollection<CvDocument> CvDocuments => _cvDocuments.AsReadOnly();
    public IReadOnlyCollection<PrepSession> PrepSessions => _prepSessions.AsReadOnly();

    private readonly List<CvDocument> _cvDocuments = [];
    private readonly List<PrepSession> _prepSessions = [];

    private User() { } // EF Core

    public static User Create(string email, string passwordHash, string firstName, string lastName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        ArgumentException.ThrowIfNullOrWhiteSpace(firstName);
        ArgumentException.ThrowIfNullOrWhiteSpace(lastName);

        return new User
        {
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim()
        };
    }

    public void UpdateProfile(string firstName, string lastName)
    {
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        SetUpdated();
    }

    public void JoinJobPrepWaitlist()
    {
        if (JobPrepWaitlistJoinedAt is not null) return; // keep the original sign-up time
        JobPrepWaitlistJoinedAt = DateTime.UtcNow;
        SetUpdated();
    }

    public void ChangePassword(string newPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newPasswordHash);
        PasswordHash = newPasswordHash;
        SetUpdated();
    }
}
