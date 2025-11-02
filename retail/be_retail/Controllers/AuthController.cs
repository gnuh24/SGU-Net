using Microsoft.AspNetCore.Mvc;
using be_retail.Models;
using be_retail.Services;
using be_retail.DTOs;
using be_retail.Api;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using be_retail.Models;
using be_retail.Services;

using System.Threading.Tasks;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        private readonly TokenService _tokenService;

    private readonly IConfiguration _config;


        public AuthController(AuthService authService, TokenService tokenService, IConfiguration config)
        {
            _authService = authService;
            _tokenService = tokenService;
                    _config = config;

        }

        [HttpPost("staff-login")]
        [AllowAnonymous]
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

            // Generate JWT tokens
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken(user);


            var response = new AuthResponse
            {
                UserId = user.UserId,
                Username = user.Username!,
                FullName = user.FullName!,
                Role = user.Role!,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };

            return Ok(new ApiResponse<AuthResponse>
            {
                Status = 200,
                Message = "Login successful.",
                Data = response
            });
        }

        [HttpPost("refresh-token")]
        [Authorize(Roles = "admin,staff")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtSettings = _config.GetSection("Jwt");
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

                var principal = handler.ValidateToken(request.RefreshToken, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateLifetime = true
                }, out SecurityToken validatedToken);

                var tokenType = principal.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
                if (tokenType != "refresh")
                    return Unauthorized(new { message = "Invalid token type" });

                var userIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);
                var usernameClaim = principal.FindFirstValue(ClaimTypes.Name);
                var roleClaim = principal.FindFirstValue(ClaimTypes.Role);

                if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(usernameClaim))
                {
                    return Unauthorized(new { message = "Missing user info in token" });
                }

                var user = new User
                {
                    UserId = int.Parse(userIdClaim),
                    Username = usernameClaim,
                    Role = roleClaim
                };

                var newAccessToken = _tokenService.GenerateAccessToken(user);
                var newRefreshToken = _tokenService.GenerateRefreshToken(user);

                return Ok(new
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken
                });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = "Invalid or expired refresh token", error = ex.Message });
            }
        }





    }
}
