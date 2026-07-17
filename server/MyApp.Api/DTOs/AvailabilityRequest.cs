namespace MyApp.Api.DTOs;

public class AvailabilityRequest
{
    public Guid ElementId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
