using be_retail.Models;
using be_retail.Repositories;
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

        public async Task<User> UpdateAsync(int id, User updatedUser)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            user.Username = updatedUser.Username;
            user.FullName = updatedUser.FullName;
            user.Role = updatedUser.Role;

            // Only update password if provided
            if (!string.IsNullOrEmpty(updatedUser.Password))
            {
                user.Password = HashPassword(updatedUser.Password);
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
