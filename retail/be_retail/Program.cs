using Microsoft.EntityFrameworkCore;
using be_retail.Data;
using be_retail.Services;
using be_retail.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserRepository>();

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

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
    
var app = builder.Build();

// Seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await be_retail.Data.DbSeeder.SeedAsync(context);
}

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
