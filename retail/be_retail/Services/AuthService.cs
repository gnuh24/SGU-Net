using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace be_retail.Services
{
    public class AuthService
    {
        private readonly UserRepository _userRepository;

        public AuthService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        // 🔹 Đăng ký user
        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            // Kiểm tra username đã tồn tại
            if (await _userRepository.GetByUsernameAsync(request.Username) != null)
                return null;

            var user = new User
            {
                Username = request.Username,
                Password = HashPassword(request.Password),
                FullName = request.FullName,
                Role = "staff" // Luôn là staff, không cho phép đăng ký admin
            };

            return await _userRepository.CreateAsync(user);
        }

        // 🔹 Đăng nhập
        public async Task<User?> LoginAsync(LoginRequest request)
        {
            var hash = HashPassword(request.Password);
            var user = await _userRepository.GetByUsernameAsync(request.Username);

            if (user == null) return null;

            return user.Password == hash ? user : null;
        }
    }
}
