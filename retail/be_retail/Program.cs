using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.FileProviders;
using System.IO;
using be_retail.Data;
using be_retail.Services;
using be_retail.Repositories;
using be_retail.Exceptions;
using be_retail.Api; // ✅ for ApiErrorResponse
using System.Net;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------------------------------
// Add services to the container
// ----------------------------------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ----------------------------------------------------
// Configure CORS
// ----------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ----------------------------------------------------
// Register application services and repositories
// ----------------------------------------------------
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<UserService>();

builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<CustomerRepository>();

builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<SupplierRepository>();

builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<CategoryRepository>();

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<ProductRepository>();

builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<InventoryRepository>();

builder.Services.AddScoped<PromotionService>();
builder.Services.AddScoped<PromotionRepository>();

builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<OrderRepository>();

builder.Services.AddScoped<OrderItemService>();
builder.Services.AddScoped<OrderItemRepository>();

builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<PaymentRepository>();

builder.Services.AddScoped<StatisticsRepository>();
builder.Services.AddScoped<StatisticsService>();

// ----------------------------------------------------
// Configure DbContext (MySQL)
// ----------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// ----------------------------------------------------
// Configure JWT Authentication
// ----------------------------------------------------
var jwtConfig = builder.Configuration.GetSection("Jwt");
var secretKey = Encoding.UTF8.GetBytes(jwtConfig["Key"]);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = true; // ✅ enable in production
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtConfig["Issuer"],

            ValidateAudience = true,
            ValidAudience = jwtConfig["Audience"],

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(secretKey),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        // ✅ Custom JWT event handlers for ApiErrorResponse
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                context.Response.ContentType = "application/json";

                var response = new ApiErrorResponse<string>(
                    401,
                    "Access token is missing or invalid.",
                    null
                );

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            },
            OnAuthenticationFailed = async context =>
            {
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                context.Response.ContentType = "application/json";

                var response = new ApiErrorResponse<string>(
                    401,
                    "Invalid or expired token.",
                    context.Exception.Message
                );

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";

                var response = new ApiErrorResponse<string>(
                    403,
                    "You do not have permission to access this resource.",
                    null
                );

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        };
    });

// ----------------------------------------------------
// Build the app
// ----------------------------------------------------
var app = builder.Build();

// ----------------------------------------------------
// Ensure directories exist
// ----------------------------------------------------
var productImageDirectory = Path.Combine(builder.Environment.ContentRootPath, "var", "image");
Directory.CreateDirectory(productImageDirectory);

// ----------------------------------------------------
// Seed initial data
// ----------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await be_retail.Data.DbSeeder.SeedAsync(context);
}

// ----------------------------------------------------
// Configure middleware
// ----------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

// Configure static files for images
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(productImageDirectory),
    RequestPath = "/images",
    OnPrepareResponse = ctx =>
    {
        // Add CORS headers for static files
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "http://localhost:3000");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type");
    }
});

// 👇 Order matters!
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
