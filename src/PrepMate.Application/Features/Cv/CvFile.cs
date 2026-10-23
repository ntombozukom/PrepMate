using FluentValidation;
using FluentValidation.Results;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.Cv;

/// <summary>Rules every uploaded CV must meet (used by both the account upload and the no-account check).</summary>
public static class CvFileRules
{
    public const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
    public static readonly string[] AllowedExtensions = [".pdf", ".docx"];

    public const string WrongTypeMessage =
        "Please upload a PDF or Word (.docx) file. Older .doc files can be saved as .docx in Word.";

    public static bool HasAllowedExtension(string fileName) =>
        AllowedExtensions.Contains(Path.GetExtension(fileName).ToLowerInvariant());

    /// <summary>Adds the file-name and size rules to a validator.</summary>
    public static void AddRules<T>(AbstractValidator<T> v, Func<T, string> fileName, Func<T, byte[]> content)
    {
        v.RuleFor(x => fileName(x)).NotEmpty().Must(HasAllowedExtension).WithMessage(WrongTypeMessage).OverridePropertyName("FileName");
        v.RuleFor(x => content(x)).NotEmpty().Must(c => c.Length <= MaxFileSizeBytes)
            .WithMessage("File size must not exceed 5 MB.").OverridePropertyName("FileContent");
    }
}

/// <summary>Turns an uploaded PDF or .docx into text, failing clearly when nothing readable comes out.</summary>
public sealed class CvTextReader(IPdfExtractorService pdfExtractor, IDocxExtractorService docxExtractor)
{
    public string Read(string fileName, byte[] content)
    {
        string text;
        try
        {
            text = Path.GetExtension(fileName).Equals(".docx", StringComparison.OrdinalIgnoreCase)
                ? docxExtractor.ExtractText(content)
                : pdfExtractor.ExtractText(content);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw Unreadable("We could not open this file. Please check it is a valid PDF or Word document.");
        }

        if (string.IsNullOrWhiteSpace(text) || text.Length < 50)
            throw Unreadable("We could not find any text in this file. If it is a scan or photo, please upload the original Word or PDF version.");

        return text;
    }

    private static Common.Exceptions.ValidationException Unreadable(string message) =>
        new([new ValidationFailure("FileContent", message)]);
}
