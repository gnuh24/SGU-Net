using System.Text;
using System.Text.Json;
using RetailMobile.Models;
using RetailMobile.Helpers;
using Microsoft.Extensions.Options;

namespace RetailMobile.Services;
public class ApiClient
{
    private readonly HttpClient _http;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly TokenService _tokenService;
    public ApiClient(IOptions<ApiClientConfig> config, TokenService tokenService)
    {
        _tokenService = tokenService;

        var cfg = config.Value;
        var baseUrl = ApiClientHelper.GetBaseUrl(cfg);
#if ANDROID
        if (cfg.UseNativeHandler)
        {
            _http = new HttpClient(new Xamarin.Android.Net.AndroidMessageHandler())
            {
                BaseAddress = new Uri(baseUrl)
            };
            return;
        }
#endif
        _http = new HttpClient()
        {
            BaseAddress = new Uri(baseUrl)
        };

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true
        };
    }



    // ------------------- PUBLIC METHODS -------------------

    public Task<T> GetAsync<T>(string path, IDictionary<string, string>? queryParams = null) =>
        SendRequestAsync<T>(HttpMethod.Get, path, queryParams);

    public Task<TResponse> PostAsync<TRequest, TResponse>(string path, TRequest body) =>
        SendRequestAsync<TResponse>(HttpMethod.Post, path, body);

    public Task<TResponse> PutAsync<TRequest, TResponse>(string path, TRequest body) =>
        SendRequestAsync<TResponse>(HttpMethod.Put, path, body);

    public Task<TResponse> PatchAsync<TRequest, TResponse>(string path, TRequest body) =>
        SendRequestAsync<TResponse>(HttpMethod.Patch, path, body);

    public Task<bool> DeleteAsync(string path, IDictionary<string, string>? queryParams = null) =>
        SendRequestAsync<bool>(HttpMethod.Delete, path, queryParams);

    // ------------------- PRIVATE HELPER -------------------

    private async Task<T> SendRequestAsync<T>(HttpMethod method, string path, object? bodyOrQuery = null)
    {
        HttpRequestMessage request;

        // Build URL + query
        if (bodyOrQuery is IDictionary<string, string> queryParams)
            request = new HttpRequestMessage(method, BuildUrl(path, queryParams));
        else
            request = new HttpRequestMessage(method, path);

        // Add body if needed
        if (bodyOrQuery != null && !(bodyOrQuery is IDictionary<string, string>))
        {
            var json = JsonSerializer.Serialize(bodyOrQuery, _jsonOptions);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        await AddAuthHeader(request);

        var response = await _http.SendAsync(request);

        // 401 Unauthorized → try refresh token
        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            bool refreshed = await RefreshTokenAsync();
            if (refreshed)
            {
                request = CloneRequest(request);
                await AddAuthHeader(request);
                response = await _http.SendAsync(request);
            }
        }

        if (!response.IsSuccessStatusCode)
        {
            if (typeof(T) == typeof(bool))
                return (T)(object)false; // DELETE trả false
            response.EnsureSuccessStatusCode();
        }

        if (typeof(T) == typeof(bool))
            return (T)(object)true; // DELETE thành công

        var resultJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(resultJson, _jsonOptions)!;
    }

    // ----- Refresh -----
    private async Task AddAuthHeader(HttpRequestMessage request)
    {
        var token = await _tokenService.GetAccessTokenAsync();
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<bool> RefreshTokenAsync()
    {
        var refreshToken = await _tokenService.GetRefreshTokenAsync();
        var content = new StringContent(JsonSerializer.Serialize(new { refreshToken }), Encoding.UTF8, "application/json");
        var res = await _http.PostAsync("/api/v1/auth/refresh-token", content);

        if (!res.IsSuccessStatusCode) return false;

        var json = await res.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(json, _jsonOptions)!;
        await _tokenService.SaveTokensAsync(tokenResponse.AccessToken, tokenResponse.RefreshToken);
        return true;
    }

    // ------------------- UTILITIES -------------------

    private string BuildUrl(string path, IDictionary<string, string> queryParams)
    {
        if (queryParams.Count == 0) return path;

        var sb = new StringBuilder("?");
        foreach (var kvp in queryParams)
        {
            sb.Append(Uri.EscapeDataString(kvp.Key));
            sb.Append('=');
            sb.Append(Uri.EscapeDataString(kvp.Value));
            sb.Append('&');
        }
        sb.Length--; // remove last &
        return path + sb;
    }

    private HttpRequestMessage CloneRequest(HttpRequestMessage request)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri)
        {
            Content = request.Content
        };
        foreach (var header in request.Headers)
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
        return clone;
    }
}
