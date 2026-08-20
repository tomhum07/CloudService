using Scalar.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CloudService.Infrastructure.Data;
using CloudService.Application.Interfaces;
using CloudService.Infrastructure.Services;
using Resend;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("CloudService.Infrastructure")
             .EnableRetryOnFailure());
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IServiceCategoryService, ServiceCategoryService>();
builder.Services.AddScoped<IServicePlanService, ServicePlanService>();
builder.Services.AddScoped<IPlanPriceService, PlanPriceService>();
builder.Services.AddScoped<INewsArticleService, NewsArticleService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();
builder.Services.AddScoped<IOrderRequestService, OrderRequestService>();
builder.Services.AddScoped<IAffiliateService, AffiliateService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Cấu hình Resend Email Service
builder.Services.AddScoped<IEmailService, ResendEmailService>();

// Cấu hình PayOS Payment Gateway
builder.Services.AddScoped<IPayOSService, PayOSService>();

// Cấu hình JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("Chưa cấu hình 'Jwt:Key' trong appsettings.json hoặc UserSecrets.");
}
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "https://cloudservice-r3rm.onrender.com",
                "http://cloudservice-r3rm.onrender.com",
                "https://tomhum07.me",
                "https://www.tomhum07.me",
                "https://api.tomhum07.me"
              )
              .SetIsOriginAllowed(origin => 
                  origin.EndsWith(".vercel.app") || 
                  origin.EndsWith("tomhum07.me") || 
                  origin.StartsWith("http://localhost:") || 
                  origin.StartsWith("https://localhost:")
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        var originalServers = document.Servers != null 
            ? new System.Collections.Generic.List<Microsoft.OpenApi.OpenApiServer>(document.Servers)
            : new System.Collections.Generic.List<Microsoft.OpenApi.OpenApiServer>();

        document.Servers = new System.Collections.Generic.List<Microsoft.OpenApi.OpenApiServer>
        {
            new Microsoft.OpenApi.OpenApiServer { Url = "https://cloudservice-r3rm.onrender.com", Description = "Production Server" }
        };

        foreach (var server in originalServers)
        {
            if (!document.Servers.Any(s => (s.Url ?? "").TrimEnd('/') == (server.Url ?? "").TrimEnd('/')))
            {
                document.Servers.Add(server);
            }
        }

        var standardLocalUrls = new[] { "https://localhost:7108", "http://localhost:5074" };
        foreach (var url in standardLocalUrls)
        {
            if (!document.Servers.Any(s => (s.Url ?? "").TrimEnd('/') == url.TrimEnd('/')))
            {
                document.Servers.Add(new Microsoft.OpenApi.OpenApiServer { Url = url, Description = "Local Development Server" });
            }
        }

        return Task.CompletedTask;
    });
});

var app = builder.Build();

// Khởi chạy Migrations và Seed Dữ liệu tự động lúc khởi động
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await DbInitializer.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Đã xảy ra lỗi trong quá trình khởi tạo dữ liệu CSDL.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowNextJS");

// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<CloudService.WebApi.Hubs.DataSyncHub>("/hubs/datasync");

app.Run();
