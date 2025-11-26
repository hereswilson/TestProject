namespace TestProject.Models
{
    public class BrowseResponseDto
    {
        public string CurrentPath { get; set; } = string.Empty;
        public string? Parent { get; set; }
        public List<FileSystemItemDto> Items { get; set; } = new List<FileSystemItemDto>();
    }
}