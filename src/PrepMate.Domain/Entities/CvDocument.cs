using PrepMate.Domain.Common;

namespace PrepMate.Domain.Entities;

public sealed class CvDocument : BaseEntity
{
    public Guid UserId { get; private set; }
    public string FileName { get; private set; } = default!;
    public string ExtractedText { get; private set; } = default!;
    public byte[] FileContent { get; private set; } = default!;
    public long FileSizeBytes { get; private set; }
    public bool IsActive { get; private set; }

    // Navigation
    public User User { get; private set; } = default!;

    private CvDocument() { } // EF Core

    public static CvDocument Create(
        Guid userId,
        string fileName,
        string extractedText,
        byte[] fileContent)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(extractedText);
        ArgumentNullException.ThrowIfNull(fileContent);

        return new CvDocument
        {
            UserId = userId,
            FileName = fileName.Trim(),
            ExtractedText = extractedText,
            FileContent = fileContent,
            FileSizeBytes = fileContent.Length,
            IsActive = true
        };
    }

    public void Deactivate()
    {
        IsActive = false;
        SetUpdated();
    }
}
