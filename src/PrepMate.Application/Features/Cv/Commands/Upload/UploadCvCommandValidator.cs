using FluentValidation;

namespace PrepMate.Application.Features.Cv.Commands.Upload;

public sealed class UploadCvCommandValidator : AbstractValidator<UploadCvCommand>
{
    public UploadCvCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        CvFileRules.AddRules(this, x => x.FileName, x => x.FileContent);
    }
}
