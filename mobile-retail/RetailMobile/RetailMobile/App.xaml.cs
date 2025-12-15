using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using RetailMobile.Models.Payment;
using RetailMobile.Presentation.ViewModels;
using RetailMobile.Presentation.Views;
using RetailMobile.Services;
using Uno.Resizetizer;
using Microsoft.UI.Xaml;
using Windows.ApplicationModel.Activation;

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
    public IHost? Host { get; private set; }


    protected async override void OnLaunched(Microsoft.UI.Xaml.LaunchActivatedEventArgs args)
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

                    // Register ViewModels
                    services.AddSingleton<SignInViewModel>();
                    services.AddSingleton<SignUpViewModel>();
                    services.AddSingleton<ProfileViewModel>();
                    services.AddSingleton<ProductListViewModel>();
                    services.AddSingleton<CheckoutViewModel>();
                    services.AddSingleton<PaymentProcessingViewModel>();
                    services.AddSingleton<WebViewViewModel>();
                    services.AddSingleton<OrderConfirmationViewModel>();

                })
                .UseNavigation(RegisterRoutes)
                
            );
        MainWindow = builder.Window;

#if DEBUG
        MainWindow.UseStudio();
#endif
        MainWindow.SetWindowIcon();

        Host = await builder.NavigateAsync<Shell>();


        using (var scope = Host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            //db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            // Initialize database
            await InitializeDatabaseAsync();
        }

    }

    protected override void OnActivated(IActivatedEventArgs args)
    {
        base.OnActivated(args);

        // Kiểm tra xem ứng dụng có được kích hoạt qua Protocol/URI Scheme không
        if (args.Kind == ActivationKind.Protocol)
        {
            if (args is ProtocolActivatedEventArgs protocolArgs)
            {
                // Host đã được tạo trong OnLaunched, giờ sử dụng nó để xử lý
                HandleDeepLink(protocolArgs.Uri);
            }
        }
    }

    // Đảm bảo bạn đang sử dụng Uno.Toolkit.UI.Extensions hoặc Microsoft.Extensions.DependencyInjection
    private void HandleDeepLink(Uri uri)
    {
        // Kiểm tra xem đây có phải là URL callback từ MoMo không (retailmobile://payment/result)
        if (uri.Host.Equals("payment", StringComparison.OrdinalIgnoreCase) &&
            uri.LocalPath.EndsWith("result", StringComparison.OrdinalIgnoreCase))
        {
            // 1. Phân tích tham số
            var queryParams = ExtractQueryParameters(uri);

            // 2. Lấy Navigator từ Host.Services (Đã sửa lỗi)
            // Lấy INavigator từ DI Container của Host
            var navigator = Host?.Services?.GetService<INavigator>();

            if (navigator != null)
            {
                // Điều hướng đến trang xử lý kết quả
                // Truyền tất cả các tham số query để ViewModel xử lý
                // Lưu ý: Nếu App đang chạy, điều hướng này sẽ ghi đè lên UI hiện tại.
                navigator.NavigateViewModelAsync<OrderConfirmationViewModel>(null, data: queryParams);
            }
        } 
    }

    private Dictionary<string, string> ExtractQueryParameters(Uri uri)
    {
        var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (uri.Query.Length > 1)
        {
            // CÁCH TỐT HƠN: Sử dụng HttpUtility (cần NuGet System.Web.HttpUtility trên Wasm)
            // hoặc System.Uri.UnescapeDataString

            // Cách thủ công:
            var query = uri.Query.Substring(1);
            var pairs = query.Split('&');
            foreach (var pair in pairs)
            {
                var parts = pair.Split('=');
                if (parts.Length == 2)
                {
                    parameters[parts[0]] = parts[1];
                }
            }
        }
        return parameters;
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
            new ViewMap<SignInPage, SignInViewModel>(),
            new ViewMap<SignUpPage,SignUpViewModel>(),
            new ViewMap<CheckoutPage, CheckoutViewModel>(),
            new DataViewMap<PaymentProcessingPage, PaymentProcessingViewModel, PaymentProcessingData>(),
            new DataViewMap<WebViewPage, WebViewViewModel, WebViewData>(),
            new DataViewMap<OrderConfirmationPage, OrderConfirmationViewModel, Dictionary<string, string>>(),
            new ViewMap<ProfilePage, ProfileViewModel>(),
            new ViewMap<ProductListPage, ProductListViewModel>(),
            new ViewMap<ProductDetailPage, ProductDetailViewModel>()
        );

        routes.Register(
            new RouteMap("", View: views.FindByViewModel<ShellViewModel>(),
                Nested:
                [
                    new ("Main", View: views.FindByViewModel<MainViewModel>()),
                    new ("Second", View: views.FindByViewModel<SecondViewModel>()),
                    new ("Checkout", View: views.FindByViewModel<CheckoutViewModel>(), IsDefault: true),
                    new ("Payment", View: views.FindByViewModel<PaymentProcessingViewModel>()),
                    new ("WebView", View: views.FindByViewModel<WebViewViewModel>()),
                    new ("SignIn", View: views.FindByViewModel<SignInViewModel>()),
                    new ("SignUp", View: views.FindByViewModel<SignUpViewModel>()),
                    new ("OrderConfirm", View: views.FindByViewModel<OrderConfirmationViewModel>()),
                    new ("Profile", View: views.FindByViewModel<ProfileViewModel>()),
                    new ("Products", View: views.FindByViewModel<ProductListViewModel>()),
                    new ("ProductDetail", View: views.FindByViewModel<ProductDetailViewModel>())                
                ]
            )
        );
    }
}
