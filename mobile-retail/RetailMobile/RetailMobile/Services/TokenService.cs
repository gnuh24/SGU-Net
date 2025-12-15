using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using RetailMobile.Models.Auth;

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
        var token = await _db.Tokens.OrderBy(token => token.Id).FirstOrDefaultAsync();
        return token?.AccessToken ?? "";
    }

    public async Task<string> GetRefreshTokenAsync()
    {
        var token = await _db.Tokens.OrderBy(token => token.Id).FirstOrDefaultAsync();
        return token?.RefreshToken ?? "";
    }


    public async Task<AuthResponse?> GetAuthAsync()
    {
        var token = await _db.Tokens
            .OrderBy(t => t.Id)
            .FirstOrDefaultAsync();

        if (token == null)
        {
            return null;
        }

        return new AuthResponse
        {
            UserId = token.UserId,
            Username = token.Username,
            FullName = token.FullName,
            Role = token.Role,
            AccessToken = token.AccessToken,
            RefreshToken = token.RefreshToken
        };
    }

    public async Task SaveTokensAsync(string accessToken, string refreshToken)
    {
        var token = await _db.Tokens.OrderBy(token => token.Id).FirstOrDefaultAsync();

        if (token == null)
        {
            token = new TokenRecord
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.Tokens.AddAsync(token);
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
        if (token != null) // Fixed: was "== null" (logic bug!)
        {  
            _db.Tokens.Remove(token);
            await _db.SaveChangesAsync();
        }
    }

    public async Task SaveAuthAsync(AuthResponse auth)
    {
        var token = await _db.Tokens
            .OrderBy(t => t.Id)
            .FirstOrDefaultAsync();

        if (token == null)
        {
            token = new TokenRecord
            {
                UserId = auth.UserId,
                Username = auth.Username,
                FullName = auth.FullName,
                Role = auth.Role,
                AccessToken = auth.AccessToken,
                RefreshToken = auth.RefreshToken,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.Tokens.AddAsync(token);
        }
        else
        {
            token.UserId = auth.UserId;
            token.Username = auth.Username;
            token.FullName = auth.FullName;
            token.Role = auth.Role;
            token.AccessToken = auth.AccessToken;
            token.RefreshToken = auth.RefreshToken;
            token.UpdatedAt = DateTime.UtcNow;

            _db.Tokens.Update(token);
        }

        await _db.SaveChangesAsync();
    }
}

