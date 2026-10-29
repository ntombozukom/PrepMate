using MediatR;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.Cv.Commands.Upload;

public sealed class UploadCvCommandHandler(
    ICvDocumentRepository cvRepository,
    CvTextReader cvTextReader)
    : IRequestHandler<UploadCvCommand, CvDocumentDto>
{
    public async Task<CvDocumentDto> Handle(UploadCvCommand request, CancellationToken cancellationToken)
    {
        // Read first, so an unreadable file never replaces the user's current CV.
        var extractedText = cvTextReader.Read(request.FileName, request.FileContent);

        // Deactivate any existing CV for this user
        var existing = await cvRepository.GetActiveByUserIdAsync(request.UserId, cancellationToken);
        existing?.Deactivate();

        var document = CvDocument.Create(
            request.UserId,
            request.FileName,
            extractedText,
            request.FileContent);

        await cvRepository.AddAsync(document, cancellationToken);
        await cvRepository.SaveChangesAsync(cancellationToken);

        return new CvDocumentDto(
            document.Id,
            document.FileName,
            document.FileSizeBytes,
            document.IsActive,
            document.CreatedAt);
    }
}
