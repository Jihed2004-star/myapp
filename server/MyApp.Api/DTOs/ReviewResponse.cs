namespace MyApp.Api.DTOs;

public class ReviewResponse
{
    public Guid Id { get; set; }
    public Guid ElementId { get; set; }
    public Guid BookingId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    
}