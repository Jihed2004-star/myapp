namespace MyApp.Api.DTOs;

public class ServiceResponse
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public Guid ProviderId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ElementResponse> Elements { get; set; } = new();
}
