using MediatR;
using PrepMate.Application.DTOs;

namespace PrepMate.Application.Features.Auth.Commands.Register;

public record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName) : IRequest<AuthResponse>;
