using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;
using TestProject.Models; 

namespace TestProject.Services
{
    public interface IFileSystemService
    {
        BrowseResponseDto GetDirectoryContents(string path);
        Task UploadFileAsync(string path, IFormFile file);
        FileDownloadDto GetFile(string path);
        void DeleteItem(string path);
        void CreateFolder(string path, string name);
        IEnumerable<FileSystemItemDto> Search(string query);
    }
}
