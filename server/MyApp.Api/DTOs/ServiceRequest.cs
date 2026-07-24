namespace MyApp.Api.DTOs;

using MyApp.Data.Entities;

public class ServiceRequest
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public BookingUnit BookingUnit { get; set; } = BookingUnit.Hourly;
}