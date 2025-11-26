using Microsoft.AspNetCore.Mvc;
using TestProject.Services;

namespace TestProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileSystemController : ControllerBase
    {
        private readonly IFileSystemService _fileService;

        public FileSystemController(IFileSystemService fileService)
        {
            _fileService = fileService;
        }

        [HttpGet("browse")]
        public IActionResult Browse([FromQuery] string path)
        {
            var result = _fileService.GetDirectoryContents(path ?? string.Empty);
            return Ok(result);
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
            if (file == null || file.Length == 0) return BadRequest("No file selected.");
            var safePath = path ?? string.Empty;
            await _fileService.UploadFileAsync(safePath, file);
            return Ok(new { Message = "Upload successful" });
        }

        [HttpGet("download")]
        public IActionResult Download(string path)
        {
            try
            {
                var fileData = _fileService.GetFile(path);
                return File(fileData.Content, fileData.MimeType, fileData.FileName);
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
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("Folder name cannot be empty.");

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