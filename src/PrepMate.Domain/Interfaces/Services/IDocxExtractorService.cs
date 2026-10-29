namespace PrepMate.Domain.Interfaces.Services;

public interface IDocxExtractorService
{
    /// <summary>Extracts plain text from a Word (.docx) byte array, one line per paragraph.</summary>
    string ExtractText(byte[] docxBytes);
}
