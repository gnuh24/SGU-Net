using Microsoft.AspNetCore.Mvc;
using be_retail.Services;
using be_retail.Models;
using be_retail.DTOs;
using be_retail.DTOs.User;
using be_retail.Api;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/users")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page.HasValue)
                {
                    var (users, total) = await _userService.GetPagedAsync(page.Value, pageSize);

                    var data = users.Select(u => new UserResponseDTO
                    {
                        UserId = u.UserId,
                        Username = u.Username!,
                        FullName = u.FullName!,
                        Role = u.Role!,
                        Status = u.Status!
                    }).ToList();

                    var response = new PagedResponse<UserResponseDTO>(data, total, page.Value, pageSize);

                    return Ok(new ApiResponse<PagedResponse<UserResponseDTO>>
                    {
                        Status = 200,
                        Message = "Get users with pagination successfully.",
                        Data = response
                    });
                }
                else
                {
                    var users = await _userService.GetAllAsync();

                    var data = users.Select(u => new UserResponseDTO
                    {
                        UserId = u.UserId,
                        Username = u.Username!,
                        FullName = u.FullName!,
                        Role = u.Role!,
                        Status = u.Status!
                    }).ToList();

                    return Ok(new ApiResponse<object>
                    {
                        Status = 200,
                        Message = "Get all users successfully.",
                        Data = data
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var user = await _userService.GetByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Status = 404,
                        Message = "User not found.",
                        Data = null
                    });
                }

                var data = new UserResponseDTO
                {
                    UserId = user.UserId,
                    Username = user.Username!,
                    FullName = user.FullName!,
                    Role = user.Role!,
                    Status = user.Status!
                };

                return Ok(new ApiResponse<UserResponseDTO>
                {
                    Status = 200,
                    Message = "Get user successfully.",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserCreateRequest request)
        {
            try
            {
                var user = new User
                {
                    Username = request.Username,
                    Password = request.Password,
                    FullName = request.FullName,
                    Role = request.Role
                };

                var created = await _userService.CreateAsync(user);

                var data = new UserResponseDTO
                {
                    UserId = created.UserId,
                    Username = created.Username!,
                    FullName = created.FullName!,
                    Role = created.Role!
                };

                return Ok(new ApiResponse<UserResponseDTO>
                {
                    Status = 200,
                    Message = "User created successfully.",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateRequest request)
        {
            try
            {
                // Truyền DTO trực tiếp vào service để xử lý partial update
                var updated = await _userService.UpdateAsync(id, request);

                var data = new UserResponseDTO
                {
                    UserId = updated.UserId,
                    Username = updated.Username!,
                    FullName = updated.FullName!,
                    Role = updated.Role!,
                    Status = updated.Status!
                };

                return Ok(new ApiResponse<UserResponseDTO>
                {
                    Status = 200,
                    Message = "User updated successfully.",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _userService.DeleteAsync(id);

                return Ok(new ApiResponse<string>
                {
                    Status = 200,
                    Message = "User deleted successfully.",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpPut("{id}/password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            try
            {
                await _userService.ChangePasswordAsync(id, request.CurrentPassword, request.NewPassword);

                return Ok(new ApiResponse<string>
                {
                    Status = 200,
                    Message = "Password changed successfully.",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }
    }
}
