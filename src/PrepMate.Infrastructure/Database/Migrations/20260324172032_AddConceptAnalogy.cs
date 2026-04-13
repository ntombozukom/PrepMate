using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrepMate.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddConceptAnalogy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Analogy",
                table: "ConceptExplanations",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Analogy",
                table: "ConceptExplanations");
        }
    }
}
