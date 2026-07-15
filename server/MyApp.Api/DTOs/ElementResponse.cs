namespace MyApp.Api.DTOs;

public class ElementResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public decimal ExtraPrice { get; set; }
}
