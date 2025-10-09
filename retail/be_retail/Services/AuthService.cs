using be_retail.Data;
using be_retail.DTOs;
using be_retail.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace be_retail.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;

        public AuthService(AppDbContext context)
        {
            _context = context;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return null;

            var user = new User
            {
                Username = request.Username,
                Password = HashPassword(request.Password),
                FullName = request.FullName,
                Role = "staff"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> LoginAsync(LoginRequest request)
        {
            var hash = HashPassword(request.Password);
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.Password == hash);
        }
    }
}
