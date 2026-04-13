using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Auth.Commands.Login;

public record LoginUserCommand(string Email, string Password) : IRequest<AuthResponse>;
