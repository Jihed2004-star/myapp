using NpgsqlTypes;

namespace MyApp.Data.Entities;

public class Availability
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ElementId { get; set; }

    public Element Element { get; set; } = null!;

    // A single open window during which this Element can be booked,
    // e.g. "available July 20 - July 25"
    public NpgsqlRange<DateTime> TimeRange { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
