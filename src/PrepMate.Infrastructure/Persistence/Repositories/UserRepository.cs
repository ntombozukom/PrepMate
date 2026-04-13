using Microsoft.EntityFrameworkCore;
using PrepMate.Domain.Entities;
using PrepMate.Domain.Interfaces.Repositories;

namespace PrepMate.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(AppDbContext context) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant().Trim(), ct);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default) =>
        context.Users.AnyAsync(u => u.Email == email.ToLowerInvariant().Trim(), ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await context.Users.AddAsync(user, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        context.SaveChangesAsync(ct);
}
