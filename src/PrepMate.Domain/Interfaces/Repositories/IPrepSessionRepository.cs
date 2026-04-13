using PrepMate.Domain.Entities;

namespace PrepMate.Domain.Interfaces.Repositories;

public interface IPrepSessionRepository
{
    Task<PrepSession?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PrepSession?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PrepSession>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(PrepSession session, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
