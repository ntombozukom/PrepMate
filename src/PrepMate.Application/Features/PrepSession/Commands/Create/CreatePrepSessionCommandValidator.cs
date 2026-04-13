using FluentValidation;
using PrepMate.Domain.Enums;

namespace PrepMate.Application.Features.PrepSession.Commands.Create;

public sealed class CreatePrepSessionCommandValidator : AbstractValidator<CreatePrepSessionCommand>
{
    public CreatePrepSessionCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CvDocumentId).NotEmpty();

        RuleFor(x => x.JobDescriptionText)
            .NotEmpty()
            .MinimumLength(100).WithMessage("Job description must be at least 100 characters.")
            .MaximumLength(60000);

        RuleFor(x => x.JobTitle)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Industry)
            .IsInEnum()
            .WithMessage("Please select a valid industry.");

        RuleFor(x => x.CompanyName)
            .MaximumLength(200)
            .When(x => x.CompanyName is not null);
    }
}
