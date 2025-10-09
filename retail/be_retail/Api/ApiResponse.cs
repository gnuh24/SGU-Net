namespace be_retail.Api
{
    public class ApiResponse<T>
    {
        public int Status { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        public ApiResponse() { }

        public ApiResponse(int status, string? message, T? data)
        {
            Status = status;
            Message = message;
            Data = data;
        }
    }
}
