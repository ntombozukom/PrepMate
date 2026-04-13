using Microsoft.EntityFrameworkCore;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Infrastructure.Persistence.Repositories;

public sealed class ConceptExplanationRepository(AppDbContext context) : IConceptExplanationRepository
{
    public async Task<IReadOnlyList<ConceptExplanation>> GetBySessionIdAsync(
        Guid sessionId,
        CancellationToken ct = default) =>
        await context.ConceptExplanations
            .Where(c => c.PrepSessionId == sessionId)
            .OrderBy(c => c.OrderIndex)
            .ToListAsync(ct);

    public async Task AddRangeAsync(
        IEnumerable<ConceptExplanation> explanations,
        CancellationToken ct = default) =>
        await context.ConceptExplanations.AddRangeAsync(explanations, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        context.SaveChangesAsync(ct);
}
