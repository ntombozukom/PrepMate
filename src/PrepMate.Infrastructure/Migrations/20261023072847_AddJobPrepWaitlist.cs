using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrepMate.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobPrepWaitlist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "JobPrepWaitlistJoinedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JobPrepWaitlistJoinedAt",
                table: "Users");
        }
    }
}
