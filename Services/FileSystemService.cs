using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TestProject.Models;

namespace TestProject.Services
{
    public class FileSystemService : IFileSystemService
    {

        private readonly string _rootPath;

        public FileSystemService(IConfiguration config)
        {
            _rootPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");

            if (!Directory.Exists(_rootPath))
            {
                Directory.CreateDirectory(_rootPath);
            }
        }

        public BrowseResponseDto GetDirectoryContents(string path)
        {
            var fullPath = GetSafePath(path);
            if (!Directory.Exists(fullPath)) throw new DirectoryNotFoundException("Directory not found.");

            var dirInfo = new DirectoryInfo(fullPath);
            var items = new List<FileSystemItemDto>();

            foreach (var dir in dirInfo.GetDirectories())
            {
                items.Add(new FileSystemItemDto
                {
                    Name = dir.Name,
                    Path = GetRelativePath(dir.FullName),
                    IsFolder = true,
                    Count = dir.GetFileSystemInfos().Length,
                    LastModified = dir.LastWriteTime
                });
            }

            foreach (var file in dirInfo.GetFiles())
            {
                items.Add(new FileSystemItemDto
                {
                    Name = file.Name,
                    Path = GetRelativePath(file.FullName),
                    IsFolder = false,
                    Size = file.Length,
                    LastModified = file.LastWriteTime,
                    Extension = file.Extension
                });
            }

            return new BrowseResponseDto
            {
                CurrentPath = path,
                Items = items,
                Parent = GetParentPath(path)
            };
        }

        public async Task UploadFileAsync(string path, IFormFile file)
        {
            var targetDir = GetSafePath(path ?? string.Empty);
            if (!Directory.Exists(targetDir)) throw new DirectoryNotFoundException("Directory does not exist.");

            var filePath = Path.Combine(targetDir, file.FileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
        }

        public FileDownloadDto GetFile(string path)
        {
            var fullPath = GetSafePath(path);
            if (!File.Exists(fullPath)) throw new FileNotFoundException("File not found.");

            var bytes = File.ReadAllBytes(fullPath);

            return new FileDownloadDto(bytes, "application/octet-stream", Path.GetFileName(fullPath));
        }

        public void DeleteItem(string path)
        {
            var fullPath = GetSafePath(path);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
            else if (Directory.Exists(fullPath))
            {
                Directory.Delete(fullPath, true);
            }
            else
            {
                throw new FileNotFoundException("Item not found");
            }
        }

        public IEnumerable<FileSystemItemDto> Search(string searchTerm)
        {
            var dirInfo = new DirectoryInfo(_rootPath);
            var options = new EnumerationOptions
            {
                RecurseSubdirectories = true,
                IgnoreInaccessible = true
            };

            var files = dirInfo.GetFiles($"*{searchTerm}*", options);

            return files.Select(f => new FileSystemItemDto
            {
                Name = f.Name,
                Path = Path.GetRelativePath(_rootPath, f.FullName), 
                IsFolder = false,
                Size = f.Length,
                LastModified = f.LastWriteTime
            });
        }

        //Helper Methods
        private string GetSafePath(string relativePath)
        {
            var safeRelative = relativePath?.TrimStart('/', '\\') ?? "";
            var fullPath = Path.GetFullPath(Path.Combine(_rootPath, safeRelative));

            if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Access to paths outside the root is denied.");
            }
            return fullPath;
        }

        private string GetRelativePath(string fullPath)
        {
            if (fullPath.Equals(_rootPath, StringComparison.OrdinalIgnoreCase)) return "";
            return fullPath.Substring(_rootPath.Length).TrimStart(Path.DirectorySeparatorChar);
        }

        private string? GetParentPath(string path)
        {
            if (string.IsNullOrEmpty(path)) return null;
            var parts = path.Trim('/', '\\').Split(new[] { '/', '\\' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length <= 1) return "";
            return string.Join("/", parts.Take(parts.Length - 1));
        }
    }
}
