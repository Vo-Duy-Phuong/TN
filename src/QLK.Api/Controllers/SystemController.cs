using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Sockets;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("server-ip")]
    public IActionResult GetServerIp()
    {
        try
        {
            // Get local IPv4 address that is not loopback
            var host = Dns.GetHostEntry(Dns.GetHostName());
            var localIp = host.AddressList
                .FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip));

            if (localIp != null)
            {
                return Ok(new { ip = localIp.ToString() });
            }

            // Fallback: try to connect to a public IP to see which local interface is used
            using (Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, 0))
            {
                socket.Connect("8.8.8.8", 65530);
                IPEndPoint? endPoint = socket.LocalEndPoint as IPEndPoint;
                if (endPoint != null)
                {
                    return Ok(new { ip = endPoint.Address.ToString() });
                }
            }
        }
        catch
        {
            // Ignore errors and return localhost as ultimate fallback
        }

        return Ok(new { ip = "localhost" });
    }
}
