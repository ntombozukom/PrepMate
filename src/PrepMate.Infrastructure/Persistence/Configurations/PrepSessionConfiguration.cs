using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PrepMate.Domain.Entities;

namespace PrepMate.Infrastructure.Persistence.Configurations;

public sealed class PrepSessionConfiguration : IEntityTypeConfiguration<PrepSession>
{
    public void Configure(EntityTypeBuilder<PrepSession> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.JobDescriptionText)
            .IsRequired();

        builder.Property(s => s.JobTitle)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.CompanyName)
            .HasMaxLength(200);

        builder.Property(s => s.Industry)
            .IsRequired();

        builder.HasMany(s => s.ConceptExplanations)
            .WithOne(c => c.PrepSession)
            .HasForeignKey(c => c.PrepSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.CvDocument)
            .WithMany()
            .HasForeignKey(s => s.CvDocumentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.UserId);
    }
}
