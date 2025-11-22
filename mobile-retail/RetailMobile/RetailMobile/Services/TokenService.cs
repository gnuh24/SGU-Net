public class TokenService : ITokenService
{
    private string _accessToken = "";
    private string _refreshToken = "";

    public Task<string> GetAccessTokenAsync() => Task.FromResult(_accessToken);
    public Task<string> GetRefreshTokenAsync() => Task.FromResult(_refreshToken);

    public Task SaveTokensAsync(string accessToken, string refreshToken)
    {
        _accessToken = accessToken;
        _refreshToken = refreshToken;
        return Task.CompletedTask;
    }
}