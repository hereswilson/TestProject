using Microsoft.AspNetCore.Mvc;
using System.Web; // For URL encoding/decoding if needed, usually built-in
using System.IO;

namespace TestProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileSystemController : ControllerBase
    {
        private readonly string _rootPath;
        private readonly ILogger<FileSystemController> _logger;

        public FileSystemController(IConfiguration config, ILogger<FileSystemController> logger)
        {
            _logger = logger;
            // Configurable home directory. Defaults to a "Data" folder in the project root if not set.
            string configuredPath = config["HomeDirectory"];
            _rootPath = string.IsNullOrEmpty(configuredPath)
                ? Path.Combine(Directory.GetCurrentDirectory(), "Uploads")
                : configuredPath;

            // Ensure the directory exists
            if (!Directory.Exists(_rootPath))
            {
                Directory.CreateDirectory(_rootPath);
            }
        }

        [HttpGet("browse")]
        public IActionResult Browse(string path = "")
        {
            try
            {
                var fullPath = GetSafePath(path);
                if (!Directory.Exists(fullPath)) return NotFound("Directory not found.");

                var dirInfo = new DirectoryInfo(fullPath);

                var items = new List<FileSystemItem>();

                // Get Directories
                foreach (var dir in dirInfo.GetDirectories())
                {
                    items.Add(new FileSystemItem
                    {
                        Name = dir.Name,
                        Path = GetRelativePath(dir.FullName),
                        IsFolder = true,
                        // Calculating size/count for folders can be expensive, keeping it primitive for POC
                        Count = dir.GetFileSystemInfos().Length,
                        LastModified = dir.LastWriteTime
                    });
                }

                // Get Files
                foreach (var file in dirInfo.GetFiles())
                {
                    items.Add(new FileSystemItem
                    {
                        Name = file.Name,
                        Path = GetRelativePath(file.FullName),
                        IsFolder = false,
                        Size = file.Length,
                        LastModified = file.LastWriteTime
                    });
                }

                return Ok(new
                {
                    CurrentPath = path,
                    Items = items,
                    Parent = GetParentPath(path)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error browsing directory");
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] string? path, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file selected.");

            try
            {
                var targetDir = GetSafePath(path ?? string.Empty);
                if (!Directory.Exists(targetDir)) return NotFound("Directory does not exist.");

                var filePath = Path.Combine(targetDir, file.FileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new { Message = "Upload successful" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Upload failed: {ex.Message}");
            }
        }

        [HttpGet("download")]
        public IActionResult Download(string path)
        {
            try
            {
                var fullPath = GetSafePath(path);
                if (!System.IO.File.Exists(fullPath)) return NotFound("File not found.");

                var fileBytes = System.IO.File.ReadAllBytes(fullPath);
                var mimeType = "application/octet-stream"; // Generic binary
                return File(fileBytes, mimeType, Path.GetFileName(fullPath));
            }
            catch (Exception ex)
            {
                return BadRequest($"Download failed: {ex.Message}");
            }
        }

        [HttpDelete("delete")]
        public IActionResult Delete(string path)
        {
            try
            {
                var fullPath = GetSafePath(path);

                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    return Ok(new { Message = "File deleted" });
                }
                else if (Directory.Exists(fullPath))
                {
                    Directory.Delete(fullPath, true); // Recursive delete
                    return Ok(new { Message = "Folder deleted" });
                }

                return NotFound("Item not found");
            }
            catch (Exception ex)
            {
                return BadRequest($"Delete failed: {ex.Message}");
            }
        }

        // --- Helpers ---

        private string GetSafePath(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return _rootPath;

            // Normalize slashes
            relativePath = relativePath.Replace('/', Path.DirectorySeparatorChar);

            // Combine and get absolute path
            var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));

            // Ensure the resulting path is still inside the root path
            if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Access denied. path is outside home directory.");
            }

            return fullPath;
        }

        private string GetRelativePath(string fullPath)
        {
            if (fullPath.Equals(_rootPath, StringComparison.OrdinalIgnoreCase)) return "";
            return fullPath.Substring(_rootPath.Length).TrimStart(Path.DirectorySeparatorChar);
        }

        private string GetParentPath(string path)
        {
            if (string.IsNullOrEmpty(path)) return null;
            var parts = path.Trim('/').Split('/');
            if (parts.Length <= 1) return "";
            return string.Join("/", parts.Take(parts.Length - 1));
        }

        public class FileSystemItem
        {
            public string Name { get; set; }
            public string? Path { get; set; }
            public bool IsFolder { get; set; }
            public long? Size { get; set; } // Bytes
            public int? Count { get; set; } 
            public DateTime LastModified { get; set; }
        }
    }
}
