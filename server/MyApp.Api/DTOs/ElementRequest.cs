namespace MyApp.Api.DTOs;

public class ElementRequest
{
    public Guid ServiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public decimal Price { get; set; }
    public Dictionary<string, string> Attributes { get; set; } = new();
}
