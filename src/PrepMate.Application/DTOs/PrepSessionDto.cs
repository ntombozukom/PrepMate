using PrepMate.Domain.Enums;

namespace PrepMate.Application.DTOs;

public record PrepSessionDto(
    Guid Id,
    string JobTitle,
    string? CompanyName,
    Industry Industry,
    string IndustryName,
    DateTime CreatedAt,
    int ConceptCount);

public record PrepSessionDetailDto(
    Guid Id,
    string JobTitle,
    string? CompanyName,
    Industry Industry,
    string IndustryName,
    string JobDescriptionText,
    DateTime CreatedAt,
    IReadOnlyList<ConceptExplanationDto> Concepts);

public record CreatePrepSessionRequest(
    Guid CvDocumentId,
    string JobDescriptionText,
    string JobTitle,
    Industry Industry,
    string? CompanyName = null);
