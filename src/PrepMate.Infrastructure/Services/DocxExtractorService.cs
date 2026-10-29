using System.IO.Compression;
using System.Text;
using System.Xml;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Infrastructure.Services;

/// <summary>
/// Reads the text of a .docx without extra dependencies: a .docx is a zip whose body is
/// word/document.xml. Text runs (w:t) are joined per paragraph (w:p), tabs and line breaks kept.
/// </summary>
public sealed class DocxExtractorService : IDocxExtractorService
{
    private const string WordNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    public string ExtractText(byte[] docxBytes)
    {
        ArgumentNullException.ThrowIfNull(docxBytes);

        using var zip = new ZipArchive(new MemoryStream(docxBytes), ZipArchiveMode.Read);
        var entry = zip.GetEntry("word/document.xml")
            ?? throw new InvalidDataException("Not a valid Word document.");

        using var stream = entry.Open();
        using var reader = XmlReader.Create(stream, new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit });

        var sb = new StringBuilder();
        var paragraph = new StringBuilder();

        while (reader.Read())
        {
            if (reader.NamespaceURI != WordNs) continue;

            if (reader.NodeType == XmlNodeType.Element)
            {
                switch (reader.LocalName)
                {
                    case "t": paragraph.Append(reader.ReadElementContentAsString()); break;
                    case "tab": paragraph.Append('\t'); break;
                    case "br": paragraph.Append('\n'); break;
                }
            }
            else if (reader.NodeType == XmlNodeType.EndElement && reader.LocalName == "p")
            {
                var line = paragraph.ToString().Trim();
                if (line.Length > 0) sb.AppendLine(line);
                paragraph.Clear();
            }
        }

        return sb.ToString().Trim();
    }
}
