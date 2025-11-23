namespace RetailMobile.Services;
public interface ITokenService
{
    Task<string> GetAccessTokenAsync();
    Task<string> GetRefreshTokenAsync();
    Task SaveTokensAsync(string accessToken, string refreshToken);
    Task DeleteTokensAsync();
}
