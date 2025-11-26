namespace TestProject.Models
{
    public record FileDownloadDto(
        byte[] Content,string MimeType, string FileName
    );
}
