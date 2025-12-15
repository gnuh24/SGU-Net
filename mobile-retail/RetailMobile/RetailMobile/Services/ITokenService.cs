namespace RetailMobile.Services;
using RetailMobile.Models.Auth;

public interface ITokenService
{
    Task<string> GetAccessTokenAsync();
    Task<string> GetRefreshTokenAsync();

    Task<AuthResponse> GetAuthAsync();

    Task SaveAuthAsync(AuthResponse auth);
    
    Task SaveTokensAsync(string accessToken, string refreshToken);
    Task DeleteTokensAsync();
}
