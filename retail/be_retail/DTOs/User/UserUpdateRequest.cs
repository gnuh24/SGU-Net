namespace be_retail.DTOs.User
{
    public class UserUpdateRequest
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; }
    }
}
