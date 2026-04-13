using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PrepMate.Domain.Entities;

namespace PrepMate.Infrastructure.Persistence.Configurations;

public sealed class CvDocumentConfiguration : IEntityTypeConfiguration<CvDocument>
{
    public void Configure(EntityTypeBuilder<CvDocument> builder)
    {
        builder.HasKey(cv => cv.Id);

        builder.Property(cv => cv.FileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(cv => cv.ExtractedText)
            .IsRequired();

        builder.Property(cv => cv.FileContent)
            .IsRequired();

        builder.Property(cv => cv.FileSizeBytes)
            .IsRequired();

        builder.Property(cv => cv.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Index to quickly find the active CV for a user
        builder.HasIndex(cv => new { cv.UserId, cv.IsActive });
    }
}
