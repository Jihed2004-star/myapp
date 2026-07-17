namespace MyApp.Api.DTOs;

public class BookingResponse
{
    public Guid Id { get; set; }
    public Guid ElementId { get; set; }
    public string ElementName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
