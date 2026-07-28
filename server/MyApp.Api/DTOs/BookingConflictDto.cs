namespace MyApp.Api.DTOs;

public class BookingConflictDto
{
    public Guid BookingId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}