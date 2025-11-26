using Microsoft.AspNetCore.Diagnostics;
using TestProject.Services;

namespace TestProject
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddScoped<IFileSystemService, FileSystemService>();

            var app = builder.Build();

            app.UseExceptionHandler(errorApp =>
            {
                errorApp.Run(async context =>
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json";

                    var feature = context.Features.Get<IExceptionHandlerPathFeature>();
                    await context.Response.WriteAsJsonAsync(new { Error = feature?.Error.Message });
                });
            });

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.MapControllers();

            app.Run();
        }
    }
}