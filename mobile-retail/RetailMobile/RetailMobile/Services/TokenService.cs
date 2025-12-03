using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using SQLite;

namespace RetailMobile.Services;

public class TokenService : ITokenService
{
    private readonly SQLiteAsyncConnection _db;

    public TokenService(DatabaseService database)
    {
        _db = database.Db;
    }

    public async Task<string> GetAccessTokenAsync()
    {
        var token = await _db.Table<TokenRecord>().FirstOrDefaultAsync();
        return token?.AccessToken ?? "";
    }

    public async Task<string> GetRefreshTokenAsync()
    {
        var token = await _db.Table<TokenRecord>().FirstOrDefaultAsync();
        return token?.RefreshToken ?? "";
    }

    public async Task SaveTokensAsync(string accessToken, string refreshToken)
    {
        var token = await _db.Table<TokenRecord>().FirstOrDefaultAsync();

        if (token == null)
        {
            token = new TokenRecord
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.InsertAsync(token);
        }
        else
        {
            token.AccessToken = accessToken;
            token.RefreshToken = refreshToken;
            token.UpdatedAt = DateTime.UtcNow;

            await _db.UpdateAsync(token);
        }
    }

    public async Task DeleteTokensAsync()
    {
        var token = await _db.Table<TokenRecord>().FirstOrDefaultAsync();
        if (token != null)
        {
            await _db.DeleteAsync(token);
        }
    }
}
