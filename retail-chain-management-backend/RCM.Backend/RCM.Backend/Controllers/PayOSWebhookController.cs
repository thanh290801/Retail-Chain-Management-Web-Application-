using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RCM.Backend.DTOs;
using RCM.Backend.Hubs;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayOSWebhookController : ControllerBase
    {
        private readonly IHubContext<PaymentHub> _hubContext;

        public PayOSWebhookController(IHubContext<PaymentHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> Receive([FromBody] PayOSPaymentNotification dto)
        {
            // Gửi thông báo tới client
            await _hubContext.Clients.All.SendAsync("paymentReceived", dto);

            return Ok(new { status = "received" });
        }
    }
}
