namespace MyApp.Api.DTOs;

public class GenerateAvailabilityResponse
{
    public int SlotsCreated { get; set; }
    public int SlotsSkipped { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
}