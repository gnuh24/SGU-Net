using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;

namespace RetailMobile.Services;
public class TokenService : ITokenService
{
    private readonly AppDbContext _db;

    public TokenService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> GetAccessTokenAsync()
    {
        var token = await _db.Tokens.FirstOrDefaultAsync();
        return token?.AccessToken ?? "";
    }

    public async Task<string> GetRefreshTokenAsync()
    {
        var token = await _db.Tokens.FirstOrDefaultAsync();
        return token?.RefreshToken ?? "";
    }

    public async Task SaveTokensAsync(string accessToken, string refreshToken)
    {
        var token = await _db.Tokens.FirstOrDefaultAsync();
        if (token == null)
        {
            token = new TokenRecord { AccessToken = accessToken, RefreshToken = refreshToken, UpdatedAt = DateTime.UtcNow };
            _db.Tokens.Add(token);
        }
        else
        {
            token.AccessToken = accessToken;
            token.RefreshToken = refreshToken;
            token.UpdatedAt = DateTime.UtcNow;
            _db.Tokens.Update(token);
        }
        await _db.SaveChangesAsync();
    }

    public async Task DeleteTokensAsync()
    {
        var token = await _db.Tokens.FirstOrDefaultAsync();
        if (token == null) {  
            _db.Tokens.Remove(token);
        }
    }
}
