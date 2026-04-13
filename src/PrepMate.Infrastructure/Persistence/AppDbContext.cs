using Microsoft.EntityFrameworkCore;
using PrepMate.Domain.Entities;
using PrepMate.Infrastructure.Persistence.Configurations;

namespace PrepMate.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<CvDocument> CvDocuments => Set<CvDocument>();
    public DbSet<PrepSession> PrepSessions => Set<PrepSession>();
    public DbSet<ConceptExplanation> ConceptExplanations => Set<ConceptExplanation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new CvDocumentConfiguration());
        modelBuilder.ApplyConfiguration(new PrepSessionConfiguration());
        modelBuilder.ApplyConfiguration(new ConceptExplanationConfiguration());

        base.OnModelCreating(modelBuilder);
    }
}
