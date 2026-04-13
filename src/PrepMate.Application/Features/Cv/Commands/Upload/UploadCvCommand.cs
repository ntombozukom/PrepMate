using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Cv.Commands.Upload;

public record UploadCvCommand(Guid UserId, string FileName, byte[] FileContent) : IRequest<CvDocumentDto>;
