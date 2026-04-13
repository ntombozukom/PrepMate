namespace PrepMate.Domain.Interfaces.Services;

public interface IPdfExtractorService
{
    /// <summary>Extracts plain text from a PDF byte array.</summary>
    string ExtractText(byte[] pdfBytes);
}
