using Microsoft.AspNetCore.Mvc;
using be_retail.Models;
using be_retail.Services;
using be_retail.DTOs;
using be_retail.Api;

using System.Threading.Tasks;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("staff-login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _authService.LoginAsync(request);
            if (user == null)
            {
                return Unauthorized(new ApiResponse<string>
                {
                    Status = 401,
                    Message = "Invalid username or password.",
                    Data = null
                });
            }

            var response = new AuthResponse
            {
                Username = user.Username!,
                FullName = user.FullName!,
                Role = user.Role!,
                Token = "jwt_token_will_be_here"
            };

            return Ok(new ApiResponse<AuthResponse>
            {
                Status = 200,
                Message = "Login successful.",
                Data = response
            });
        }
    }
}
