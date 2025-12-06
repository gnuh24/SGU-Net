using be_retail.Models;
using be_retail.Repositories;
using be_retail.DTOs.User;
using System.Security.Cryptography;
using System.Text;

namespace be_retail.Services
{
    public class UserService
    {
        private readonly UserRepository _userRepository;

        public UserService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<(List<User>, int)> GetPagedAsync(int page, int pageSize)
        {
            return await _userRepository.GetPagedAsync(page, pageSize);
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _userRepository.GetAllAsync();
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task<User> CreateAsync(User user)
        {
            // Hash password
            user.Password = HashPassword(user.Password!);
            return await _userRepository.CreateAsync(user);
        }

        public async Task<User> UpdateAsync(int id, UserUpdateRequest request)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Cập nhật từng trường nếu có gửi từ FE (partial update)
            if (!string.IsNullOrWhiteSpace(request.Username))
                user.Username = request.Username;

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName;

            if (!string.IsNullOrWhiteSpace(request.Role))
                user.Role = request.Role;

            if (!string.IsNullOrWhiteSpace(request.Status))
                user.Status = request.Status;

            // Chỉ hash & cập nhật password nếu FE gửi mật khẩu mới
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.Password = HashPassword(request.Password);
            }

            return await _userRepository.UpdateAsync(user);
        }

        public async Task DeleteAsync(int id)
        {
            await _userRepository.DeleteAsync(id);
        }

        public async Task<User> ChangePasswordAsync(int id, string currentPassword, string newPassword)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Verify current password
            if (user.Password != HashPassword(currentPassword))
            {
                throw new Exception("Current password is incorrect");
            }

            // Update to new password
            user.Password = HashPassword(newPassword);
            return await _userRepository.UpdateAsync(user);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
