using Microsoft.AspNetCore.Http;
using System.Text.Json;
using System.Threading.Tasks;
using be_retail.Exceptions;
using be_retail.Api; // 👈 import your ApiErrorResponse namespace

namespace be_retail.Exceptions
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = exception switch
            {
                JwtTokenMissingException => StatusCodes.Status401Unauthorized,
                JwtTokenInvalidException => StatusCodes.Status401Unauthorized,
                JwtTokenExpiredException => StatusCodes.Status401Unauthorized,
                JwtTokenRevokedException => StatusCodes.Status401Unauthorized,
                JwtPermissionDeniedException => StatusCodes.Status403Forbidden,
                _ => StatusCodes.Status500InternalServerError
            };

            context.Response.StatusCode = statusCode;

            var response = new ApiErrorResponse<object>(
                statusCode,
                exception.Message,
                null
            );

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });

            await context.Response.WriteAsync(json);
        }
    }
}
