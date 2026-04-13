using PrepMate.Domain.Entities;

namespace PrepMate.Domain.Interfaces.Repositories;

public interface IConceptExplanationRepository
{
    Task<IReadOnlyList<ConceptExplanation>> GetBySessionIdAsync(Guid sessionId, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<ConceptExplanation> explanations, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
