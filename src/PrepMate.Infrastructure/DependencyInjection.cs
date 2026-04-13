using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PrepMate.Domain.Interfaces.Repositories;
using PrepMate.Domain.Interfaces.Services;
using PrepMate.Infrastructure.Options;
using PrepMate.Infrastructure.Persistence;
using PrepMate.Infrastructure.Persistence.Repositories;
using PrepMate.Infrastructure.Services;
using System.Text;

namespace PrepMate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Options
        services.Configure<ClaudeOptions>(configuration.GetSection(ClaudeOptions.SectionName));
        services.Configure<GroqOptions>(configuration.GetSection(GroqOptions.SectionName));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<GoogleOptions>(configuration.GetSection(GoogleOptions.SectionName));

        // Database
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICvDocumentRepository, CvDocumentRepository>();
        services.AddScoped<IPrepSessionRepository, PrepSessionRepository>();
        services.AddScoped<IConceptExplanationRepository, ConceptExplanationRepository>();

        // Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPdfExtractorService, PdfExtractorService>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        var aiProvider = configuration["AiProvider"] ?? "Claude";
        if (aiProvider.Equals("Groq", StringComparison.OrdinalIgnoreCase))
            services.AddHttpClient<IClaudeService, GroqService>();
        else
            services.AddHttpClient<IClaudeService, ClaudeService>();

        // JWT Authentication
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT configuration is missing.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opts =>
            {
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.SecretKey))
                };
            });

        services.AddAuthorization();

        return services;
    }
}
