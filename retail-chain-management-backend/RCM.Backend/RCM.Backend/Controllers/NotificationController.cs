using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

using RCM.Backend.Models; // ✅ Context và Notification nằm trong Models

namespace RetailChain.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public NotificationController(RetailChainContext context)
        {
            _context = context;
        }

        // POST: api/notification/send
        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] Notification notification)
        {
            notification.CreatedAt = DateTime.Now;
            notification.IsRead = false;

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(notification);
        }

        // GET: api/notification/unread?accountId=1
        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadNotifications([FromQuery] int accountId)
        {
            var list = await _context.Notifications
                .Where(n => n.ReceiverAccountId == accountId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/notification/all?accountId=1
        [HttpGet("all")]
        public async Task<IActionResult> GetAllNotifications([FromQuery] int accountId)
        {
            var list = await _context.Notifications
                .Where(n => n.ReceiverAccountId == accountId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(list);
        }

        // POST: api/notification/mark-as-read/5
        [HttpPost("mark-as-read/{id}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notif = await _context.Notifications.FindAsync(id);
            if (notif == null) return NotFound();

            notif.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // POST: api/notification/mark-all-read?accountId=1
        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead([FromQuery] int accountId)
        {
            var notifs = await _context.Notifications
                .Where(n => n.ReceiverAccountId == accountId && !n.IsRead)
                .ToListAsync();

            foreach (var n in notifs)
                n.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
