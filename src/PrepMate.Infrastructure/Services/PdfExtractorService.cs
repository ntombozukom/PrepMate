using System.Text;
using PrepMate.Domain.Interfaces.Services;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace PrepMate.Infrastructure.Services;

public sealed class PdfExtractorService : IPdfExtractorService
{
    public string ExtractText(byte[] pdfBytes)
    {
        ArgumentNullException.ThrowIfNull(pdfBytes);

        using var document = PdfDocument.Open(pdfBytes);
        var sb = new StringBuilder();

        foreach (Page page in document.GetPages())
        {
            var words = page.GetWords();
            foreach (var word in words)
            {
                sb.Append(word.Text);
                sb.Append(' ');
            }
            sb.AppendLine();
        }

        return sb.ToString().Trim();
    }
}
