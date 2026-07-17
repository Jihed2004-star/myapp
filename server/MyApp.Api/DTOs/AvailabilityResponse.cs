namespace MyApp.Api.DTOs;

public class AvailabilityResponse
{
    public Guid Id { get; set; }
    public Guid ElementId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime CreatedAt { get; set; }
}
