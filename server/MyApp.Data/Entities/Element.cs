namespace MyApp.Data.Entities;

public class Element
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign key + navigation property, same pattern as Service -> Category
    public Guid ServiceId { get; set; }

    public Service Service { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public int OrderIndex { get; set; }

    public decimal ExtraPrice { get; set; }
}