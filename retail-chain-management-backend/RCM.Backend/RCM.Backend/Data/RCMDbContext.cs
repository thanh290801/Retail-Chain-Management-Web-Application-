using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

public class RCMDbContext : DbContext
{
    public RCMDbContext(DbContextOptions<RCMDbContext> options) : base(options) { }

    public DbSet<Account> Account { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderDetail> OrderDetails { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Chỉ định rõ ràng rằng DbSet<Account> ánh xạ tới bảng "Account" trong Database
        modelBuilder.Entity<Account>().ToTable("Account");
        modelBuilder.Entity<Employee>().ToTable("Employee");
        modelBuilder.Entity<Warehouse>().ToTable("warehouses");
        modelBuilder.Entity<Product>().ToTable("products");
        modelBuilder.Entity<Order>().ToTable("Order");
        modelBuilder.Entity<OrderDetail>().ToTable("OrderDetail");
    }
}