namespace PrepMate.Domain.Interfaces.Services;

public interface IPasswordHasher
{
    string Hash(string plainText);
    bool Verify(string plainText, string hash);
}
