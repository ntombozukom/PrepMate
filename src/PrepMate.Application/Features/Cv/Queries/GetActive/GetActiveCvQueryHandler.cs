using MediatR;
using PrepMate.Application.DTOs;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Application.Features.Cv.Queries.GetActive;

public sealed class GetActiveCvQueryHandler(ICvDocumentRepository cvRepository)
    : IRequestHandler<GetActiveCvQuery, CvDocumentDto?>
{
    public async Task<CvDocumentDto?> Handle(GetActiveCvQuery request, CancellationToken cancellationToken)
    {
        var document = await cvRepository.GetActiveByUserIdAsync(request.UserId, cancellationToken);
        if (document is null) return null;

        return new CvDocumentDto(
            document.Id,
            document.FileName,
            document.FileSizeBytes,
            document.IsActive,
            document.CreatedAt);
    }
}
