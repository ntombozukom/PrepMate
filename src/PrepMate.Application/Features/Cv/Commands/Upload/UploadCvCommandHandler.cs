using MediatR;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;

namespace PrepMate.Application.Features.Cv.Commands.Upload;

public sealed class UploadCvCommandHandler(
    ICvDocumentRepository cvRepository,
    IPdfExtractorService pdfExtractor)
    : IRequestHandler<UploadCvCommand, CvDocumentDto>
{
    public async Task<CvDocumentDto> Handle(UploadCvCommand request, CancellationToken cancellationToken)
    {
        // Deactivate any existing CV for this user
        var existing = await cvRepository.GetActiveByUserIdAsync(request.UserId, cancellationToken);
        existing?.Deactivate();

        // Extract text from the uploaded PDF
        var extractedText = pdfExtractor.ExtractText(request.FileContent);

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
