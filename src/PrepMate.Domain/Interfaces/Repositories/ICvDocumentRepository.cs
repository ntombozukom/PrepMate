using PrepMate.Domain.Entities;

namespace PrepMate.Domain.Interfaces.Repositories;

public interface ICvDocumentRepository
{
    Task<CvDocument?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CvDocument?> GetActiveByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<CvDocument>> GetAllByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(CvDocument document, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
