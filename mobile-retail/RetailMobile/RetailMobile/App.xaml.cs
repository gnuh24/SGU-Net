using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using RetailMobile.Presentation.ViewModels;
using RetailMobile.Services;
using Uno.Resizetizer;

namespace RetailMobile;

public partial class App : Application
{
    /// <summary>
    /// Initializes the singleton application object. This is the first line of authored code
    /// executed, and as such is the logical equivalent of main() or WinMain().
    /// </summary>
    public App()
    {
        this.InitializeComponent();
    }

    protected Window? MainWindow { get; private set; }
    protected IHost? Host { get; private set; }

    protected async override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var builder = this.CreateBuilder(args)
            // Add navigation support for toolkit controls such as TabBar and NavigationView
            .UseToolkitNavigation()
            .Configure(host => host
#if DEBUG
                // Switch to Development environment when running in DEBUG
                .UseEnvironment(Environments.Development)
#endif
                .UseLogging(configure: (context, logBuilder) =>
                {
                    // Configure log levels for different categories of logging
                    logBuilder
                        .SetMinimumLevel(
                            context.HostingEnvironment.IsDevelopment() ?
                                LogLevel.Information :
                                LogLevel.Warning)

                        // Default filters for core Uno Platform namespaces
                        .CoreLogLevel(LogLevel.Warning);

                    // Uno Platform namespace filter groups
                    // Uncomment individual methods to see more detailed logging
                    //// Generic Xaml events
                    //logBuilder.XamlLogLevel(LogLevel.Debug);
                    //// Layout specific messages
                    //logBuilder.XamlLayoutLogLevel(LogLevel.Debug);
                    //// Storage messages
                    //logBuilder.StorageLogLevel(LogLevel.Debug);
                    //// Binding related messages
                    //logBuilder.XamlBindingLogLevel(LogLevel.Debug);
                    //// Binder memory references tracking
                    //logBuilder.BinderMemoryReferenceLogLevel(LogLevel.Debug);
                    //// DevServer and HotReload related
                    //logBuilder.HotReloadCoreLogLevel(LogLevel.Information);
                    //// Debug JS interop
                    //logBuilder.WebAssemblyLogLevel(LogLevel.Debug);

                }, enableUnoLogging: true)
                .UseConfiguration(configure: configBuilder =>
                    configBuilder
                        .EmbeddedSource<App>()
                        .Section<AppConfig>()
                )
                // Enable localization (see appsettings.json for supported languages)
                .UseLocalization()
                .UseHttp((context, services) =>
                {
#if DEBUG
                    // DelegatingHandler will be automatically injected
                    services.AddTransient<DelegatingHandler, DebugHttpHandler>();
#endif

                })
                .ConfigureServices((context, services) =>
                {
                    // Đường dẫn database platform-specific
#if ANDROID
                    string dbPath = Path.Combine(Android.App.Application.Context!.FilesDir!.Path, "app.db3");
#elif IOS
                    string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "app.db3");
#else
                    string dbPath = "app.db3"; // Desktop
#endif

                    // Add DbContext
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseSqlite($"Filename={dbPath}");
                    });

                    // Add CartService
                    services.AddSingleton<CartService>();

                    // Add TokenService
                    services.AddSingleton<ITokenService, TokenService>();

                    // ApiClientConfig từ appsettings.json
                    services.Configure<ApiClientConfig>(context.Configuration.GetSection("ApiClient"));

                    // ApiClient
                    services.AddSingleton<ApiClient>();
                })
                .UseNavigation(RegisterRoutes)
            );
        MainWindow = builder.Window;

#if DEBUG
        MainWindow.UseStudio();
#endif
        MainWindow.SetWindowIcon();

        Host = await builder.NavigateAsync<Shell>();

        // Initialize database
        await InitializeDatabaseAsync();
    }

    private async Task InitializeDatabaseAsync()
    {
        try
        {
            if (Host?.Services != null)
            {
                using var scope = Host.Services.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // Ensure database is created
                await dbContext.Database.EnsureCreatedAsync();

                // Seed data if empty
                if (!await dbContext.Products.AnyAsync())
                {
                    System.Diagnostics.Debug.WriteLine("Seeding database...");
                    var assembly = System.Reflection.Assembly.GetExecutingAssembly();
                    var resourceName = "RetailMobile.Assets.products.json";

                    using var stream = assembly.GetManifestResourceStream(resourceName);
                    if (stream != null)
                    {
                        using var reader = new StreamReader(stream);
                        var json = await reader.ReadToEndAsync();
                        var products = System.Text.Json.JsonSerializer.Deserialize<List<RetailMobile.Models.Product>>(json);

                        if (products != null)
                        {
                            await dbContext.Products.AddRangeAsync(products);
                            await dbContext.SaveChangesAsync();
                            System.Diagnostics.Debug.WriteLine($"Seeded {products.Count} products.");
                        }
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine($"Resource not found: {resourceName}");
                        // List available resources for debugging
                        foreach (var res in assembly.GetManifestResourceNames())
                        {
                            System.Diagnostics.Debug.WriteLine($"Available resource: {res}");
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // Log the error
            System.Diagnostics.Debug.WriteLine($"Database initialization failed: {ex.Message}");
        }
    }

    private static void RegisterRoutes(IViewRegistry views, IRouteRegistry routes)
    {
        views.Register(
            new ViewMap(ViewModel: typeof(ShellViewModel)),
            new ViewMap<MainPage, MainViewModel>(),
            new DataViewMap<SecondPage, SecondViewModel, Entity>(),
            new ViewMap<ProductListPage, ProductListViewModel>()
        );

        routes.Register(
            new RouteMap("", View: views.FindByViewModel<ShellViewModel>(),
                Nested:
                [
                    new ("Main", View: views.FindByViewModel<MainViewModel>(), IsDefault:true),
                    new ("Second", View: views.FindByViewModel<SecondViewModel>()),
                    new ("Products", View: views.FindByViewModel<ProductListViewModel>()),
                ]
            )
        );
    }
}
