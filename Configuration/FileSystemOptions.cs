namespace TestProject.Configuration
{
    public class FileSystemOptions
    {
        public const string SectionName = "FileSystem";

        public string UploadDirectory { get; set; } = "Uploads";
        public string[] AllowedExtensions { get; set; } = Array.Empty<string>();
        public int MaxFileSizeInMb { get; set; } = 100;

    }
}
