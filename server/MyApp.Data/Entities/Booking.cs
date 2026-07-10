using NpgsqlTypes;

namespace MyApp.Data.Entities;

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    // Changed from ServiceId -> ElementId.
    // The Element is the actual bookable unit; the parent Service
    // is still reachable via booking.Element.Service when needed.
    public Guid ElementId { get; set; }

    public Element Element { get; set; } = null!;

    // Postgres tstzrange column - a single field holding both start and end time.
    public NpgsqlRange<DateTime> TimeRange { get; set; }

    public string Status { get; set; } = "Confirmed"; // Confirmed, Cancelled, Completed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}