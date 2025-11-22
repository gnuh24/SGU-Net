public record ApiClientConfig
{
    public string? Url { get; init; }
    public bool UseNativeHandler { get; init; }
}