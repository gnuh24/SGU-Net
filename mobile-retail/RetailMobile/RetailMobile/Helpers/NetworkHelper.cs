using System.Linq;
using System.Net;
using System.Net.Sockets;
using Windows.Devices.Printers;

namespace RetailMobile.Helpers;

public static class NetworkHelper
{
    public static string GetLocalIPAddress()
    {
        var host = Dns.GetHostEntry(Dns.GetHostName());
        var ip = host.AddressList.FirstOrDefault(a =>
            a.AddressFamily == AddressFamily.InterNetwork
            && a.ToString().StartsWith("192")
        );
        if (ip != null)
        {
            return ip.ToString();
        }
        return "192.168.1.100";
    }
}