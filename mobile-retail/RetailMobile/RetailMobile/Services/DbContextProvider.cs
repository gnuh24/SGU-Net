using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using System.IO;

namespace RetailMobile.Services;

public static class DbContextProvider
{
    public static void AddDbContext(IServiceCollection services)
    {
#if ANDROID
        string dbPath = Path.Combine(Android.App.Application.Context.FilesDir.Path, "app.db3");
#elif IOS
        string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "app.db3");
#else
        string dbPath = "app.db3"; // Desktop
#endif

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlite($"Filename={dbPath}");
        });
    }
}
