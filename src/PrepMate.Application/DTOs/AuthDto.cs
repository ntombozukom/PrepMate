namespace PrepMate.Application.DTOs;

public record RegisterRequest(string Email, string Password, string FirstName, string LastName);

public record LoginRequest(string Email, string Password);

public record GoogleLoginRequest(string IdToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(Guid Id, string Email, string FirstName, string LastName);

public record UpdateProfileRequest(string FirstName, string LastName);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
