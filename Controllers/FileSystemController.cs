using Microsoft.AspNetCore.Mvc;
using TestProject.Services;
using Microsoft.Extensions.Options;
using TestProject.Configuration;

namespace TestProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileSystemController : ControllerBase
    {
        private readonly IFileSystemService _fileService;
        private readonly FileSystemOptions _options;

        public FileSystemController(IFileSystemService fileService, IOptions<FileSystemOptions> options)
        {
            _fileService = fileService;
            _options = options.Value;
        }

        [HttpGet("browse")]
        public IActionResult Browse([FromQuery] string? path)
        {
            try
            {
                var result = _fileService.GetDirectoryContents(path ?? string.Empty);
                return Ok(result);
            }
            catch (DirectoryNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpGet("search")]
        public IActionResult Search([FromQuery] string query)
        {
            var result = _fileService.Search(query);
            return Ok(result);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] string? path, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) 
                return BadRequest("No file selected.");

            long maxFileSize = _options.MaxFileSizeInMb * 1024 * 1024; // 100MB
            if (file.Length > maxFileSize)
                return BadRequest($"File size exceeds maximum allowed size of {_options.MaxFileSizeInMb}MB.");


            var fileName = Path.GetFileName(file.FileName);
            if (string.IsNullOrWhiteSpace(fileName) ||
                fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                return BadRequest("Invalid file name.");

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!_options.AllowedExtensions.Contains(extension))
                return BadRequest($"File type {extension} is not allowed.");

            var safePath = path ?? string.Empty;
            await _fileService.UploadFileAsync(safePath, file);
            return Ok(new { Message = "Upload successful" });
        }

        [HttpGet("download")]
        public IActionResult Download(string path)
        {
            try
            {
                return _fileService.GetFileResult(path);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found.");
            }
        }

        [HttpDelete("delete")]
        public IActionResult Delete(string path)
        {
            _fileService.DeleteItem(path);
            return Ok(new { Message = "Item deleted" });
        }

        [HttpPost("mkdir")]
        public IActionResult CreateFolder([FromQuery] string? path, [FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name)) 
                return BadRequest("Folder name cannot be empty.");

            if (name.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                return BadRequest("Folder name contains invalid characters.");

            try
            {
                _fileService.CreateFolder(path ?? string.Empty, name);
                return Ok(new { Message = "Folder created" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}