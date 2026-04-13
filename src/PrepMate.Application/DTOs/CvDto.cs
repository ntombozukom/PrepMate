namespace PrepMate.Application.DTOs;

public record CvDocumentDto(
    Guid Id,
    string FileName,
    long FileSizeBytes,
    bool IsActive,
    DateTime UploadedAt);

public record UploadCvRequest(string FileName, byte[] FileContent);
