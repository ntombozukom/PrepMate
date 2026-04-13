using Microsoft.EntityFrameworkCore;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Infrastructure.Persistence.Repositories;

public sealed class CvDocumentRepository(AppDbContext context) : ICvDocumentRepository
{
    public Task<CvDocument?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.CvDocuments.FirstOrDefaultAsync(cv => cv.Id == id, ct);

    public Task<CvDocument?> GetActiveByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        context.CvDocuments.FirstOrDefaultAsync(cv => cv.UserId == userId && cv.IsActive, ct);

    public async Task<IReadOnlyList<CvDocument>> GetAllByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await context.CvDocuments
            .Where(cv => cv.UserId == userId)
            .OrderByDescending(cv => cv.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(CvDocument document, CancellationToken ct = default) =>
        await context.CvDocuments.AddAsync(document, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        context.SaveChangesAsync(ct);
}
