using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Auth.Commands.GoogleLogin;

public record GoogleLoginCommand(string IdToken) : IRequest<AuthResponse>;
