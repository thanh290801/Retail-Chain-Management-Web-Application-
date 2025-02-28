using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

public class RCMDbContext : DbContext
{
    public RCMDbContext(DbContextOptions<RCMDbContext> options) : base(options) { }

    public DbSet<Account> Account { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Chỉ định rõ ràng rằng DbSet<Account> ánh xạ tới bảng "Account" trong Database
        modelBuilder.Entity<Account>().ToTable("Account");
    }
}