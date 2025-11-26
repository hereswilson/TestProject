namespace TestProject.Models
{
    public record FileDownloadDto(
        Stream Content,string MimeType, string FileName
    );
}
