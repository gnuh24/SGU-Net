using System;
using System.IO;
using System.Net.Http;
using Uno.Foundation;


namespace RetailMobile.Helpers;
public static class ApiClientHelper
{
    public static string GetBaseUrl(ApiClientConfig config)
    {
#if ANDROID
        // Android Emulator
        if (IsEmulator())
        {
            return "http://10.0.2.2:5260";
        }

        // Device thật → dùng LAN IP
        return $"http://{NetworkHelper.GetLocalIPAddress()}:5260";
        
        // Device thật -> dùng IP cố định
        //return "http://192.168.1.11:5260";  // Thay bằng IP thật của bạn
#elif IOS
        // iOS simulator chạy localhost được
        return config.Url!;
#else
        // Windows / WASM
        return config.Url!;
#endif
    }

#if ANDROID
    private static bool IsEmulator()
    {
        return Android.OS.Build.Fingerprint!.Contains("generic") ||
               Android.OS.Build.Fingerprint!.Contains("emulator") ||
               Android.OS.Build.Model!.Contains("Emulator");
    }
#endif
}
