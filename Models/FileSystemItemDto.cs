namespace TestProject.Models
{
    public class FileSystemItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public bool IsFolder { get; set; }
        public long? Size { get; set; }
        public int? Count { get; set; }
        public DateTime LastModified { get; set; }
        public string? Extension { get; set; }
    }
}