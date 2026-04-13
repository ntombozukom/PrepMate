using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PrepMate.Domain.Entities;

namespace PrepMate.Infrastructure.Persistence.Configurations;

public sealed class ConceptExplanationConfiguration : IEntityTypeConfiguration<ConceptExplanation>
{
    public void Configure(EntityTypeBuilder<ConceptExplanation> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Topic)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Question)
            .IsRequired();

        builder.Property(c => c.PlainEnglishExplanation)
            .IsRequired();

        builder.Property(c => c.Analogy);

        builder.Property(c => c.TechnicalDepth);

        builder.Property(c => c.IndustryContext);

        builder.Property(c => c.SuggestedAnswer);

        builder.Property(c => c.Difficulty)
            .IsRequired();

        builder.Property(c => c.OrderIndex)
            .IsRequired();

        builder.HasIndex(c => c.PrepSessionId);
    }
}
