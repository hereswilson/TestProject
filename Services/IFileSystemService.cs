using Microsoft.AspNetCore.Mvc;
using TestProject.Models; 

namespace TestProject.Services
{
    public interface IFileSystemService
    {
        BrowseResponseDto GetDirectoryContents(string path);
        Task UploadFileAsync(string path, IFormFile file);
        FileStreamResult GetFileResult(string path);
        void DeleteItem(string path);
        void CreateFolder(string path, string name);
        IEnumerable<FileSystemItemDto> Search(string query);
    }
}
