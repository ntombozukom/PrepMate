using Microsoft.EntityFrameworkCore;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Infrastructure.Persistence.Repositories;

public sealed class PrepSessionRepository(AppDbContext context) : IPrepSessionRepository
{
    public Task<PrepSession?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.PrepSessions.FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<PrepSession?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        context.PrepSessions
            .Include(s => s.ConceptExplanations)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IReadOnlyList<PrepSession>> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await context.PrepSessions
            .Include(s => s.ConceptExplanations)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(PrepSession session, CancellationToken ct = default) =>
        await context.PrepSessions.AddAsync(session, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        context.SaveChangesAsync(ct);
}
