namespace MyApp.Api.DTOs;

using MyApp.Data.Entities;

public class ElementResponse
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public decimal Price { get; set; }
    public Dictionary<string, string> Attributes { get; set; } = new();
    public BookingUnit BookingUnit { get; set; }
    public bool IsActive { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}