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

        private readonly CustomerRepository _customerRepository;

        public AuthService(UserRepository userRepository, CustomerRepository customerRepository)
        {
            _userRepository = userRepository;
            _customerRepository = customerRepository;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            // 1. Kiểm tra username đã tồn tại
            if (await _userRepository.GetByUsernameAsync(request.Username) != null){
                throw new Exception("Username đã tồn tại");
            }

            Customer? customer = null;

            // 2. Tìm customer theo số điện thoại
            if (!string.IsNullOrEmpty(request.Phone))
            {
                customer = await _customerRepository.GetByPhoneAsync(request.Phone);

                if (customer != null)
                {
                    // 2.1 Kiểm tra customer này đã có user chưa
                    var existingUser = await _userRepository.GetByCustomerIdAsync(customer.CustomerId);

                    if (existingUser != null)
                    {
                        throw new Exception("Số điện thoại này đã được tạo tài khoản trước đó.");
                    }
                }
            }

            // 3. Nếu chưa có customer thì tạo mới
            if (customer == null)
            {
                customer = new Customer
                {
                    Name = request.FullName,
                    Phone = request.Phone
                };

                customer = await _customerRepository.CreateAsync(customer);
            }

            // 4. Tạo user và liên kết customer_id
            var user = new User
            {
                Username = request.Username,
                Password = HashPassword(request.Password),
                FullName = request.FullName,
                Role = "customer",
                Status = "active",
                CustomerId = customer.CustomerId
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
