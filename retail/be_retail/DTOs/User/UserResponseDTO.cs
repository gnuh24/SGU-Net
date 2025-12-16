namespace be_retail.DTOs.User
{
    public class UserResponseDTO
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string Status { get; set; } = null!;

        public CustomerResponseDTO? Customer { get; set; }
    }
}
