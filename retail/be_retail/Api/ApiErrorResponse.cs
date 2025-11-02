namespace be_retail.Api
{
    public class ApiErrorResponse<T>
    {
        public int Status { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        public ApiErrorResponse() { }

        public ApiErrorResponse(int status, string? message, T? data)
        {
            Status = status;
            Message = message;
            Data = data;
        }
    }
}
