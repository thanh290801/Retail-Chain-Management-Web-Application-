using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Services;
using RCM.Backend.Models;
using Newtonsoft.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc; // Đảm bảo namespace này được thêm nếu cần

var builder = WebApplication.CreateBuilder(args);

// 🔹 Kết nối Database
builder.Services.AddDbContext<RetailChainContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 🔹 Đăng ký các service
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSignalR();

// 🔹 Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName); // Sử dụng FullName (bao gồm namespace) làm schemaId
});
// 🔹 Cấu hình JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            RequireExpirationTime = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"])),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
    });

// Thêm controllers và cấu hình Newtonsoft.Json
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore; // Xử lý vòng lặp tham chiếu
    });
builder.Services.AddLogging(logging =>
{
    logging.AddConsole(); // Hiển thị log trên console
    logging.SetMinimumLevel(LogLevel.Information);
});
builder.Services.AddHostedService<AutoPayrollService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RetailChain API",
        Version = "v1",
        Description = "API cho hệ thống quản lý bán lẻ",
        Contact = new OpenApiContact
        {
            Name = "Hỗ trợ kỹ thuật",
            Email = "support@retailchain.com",
            Url = new Uri("https://retailchain.com")
        }
    });

    // 🔹 Cấu hình Bearer Token trong Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.WebHost.UseUrls("http://localhost:5000", "http://rcm-backend.local:5000");

var app = builder.Build();

// 🔹 Thêm Swagger vào Middleware
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseCors("AllowReactApp");
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<RCM.Backend.Hubs.PaymentHub>("/paymentHub");
app.MapControllers();
app.Run();