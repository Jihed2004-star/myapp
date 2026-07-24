namespace MyApp.Api.DTOs;

public class GenerateAvailabilityRequest
{
    public Guid ElementId { get; set; }
    public List<DayOfWeek> DaysOfWeek { get; set; } = new();
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
}