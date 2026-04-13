using FluentValidation;

namespace PrepMate.Application.Features.Cv.Commands.Upload;

public sealed class UploadCvCommandValidator : AbstractValidator<UploadCvCommand>
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly string[] AllowedExtensions = [".pdf"];

    public UploadCvCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();

        RuleFor(x => x.FileName)
            .NotEmpty()
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Only PDF files are supported.");

        RuleFor(x => x.FileContent)
            .NotEmpty()
            .Must(content => content.Length <= MaxFileSizeBytes)
            .WithMessage("File size must not exceed 5 MB.");
    }
}
