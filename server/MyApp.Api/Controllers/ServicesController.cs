using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Data;
using MyApp.Data.Entities;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceResponse>>> GetAll([FromQuery] Guid? categoryId)
    {
        var query = _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == categoryId.Value);
        }

        var services = await query.Select(s => MapToResponse(s)).ToListAsync();

        return Ok(services);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceResponse>> GetById(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        return Ok(MapToResponse(service));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    public async Task<ActionResult<ServiceResponse>> Create(ServiceRequest request)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "CategoryId does not reference an existing category." });
        }

        var service = new Service
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            IsActive = request.IsActive
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        // Reload with Category included so the response has CategoryName populated
        await _context.Entry(service).Reference(s => s.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = service.Id }, MapToResponse(service));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ServiceResponse>> Update(Guid id, ServiceRequest request)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "CategoryId does not reference an existing category." });
        }

        service.CategoryId = request.CategoryId;
        service.Name = request.Name;
        service.Description = request.Description;
        service.DurationMinutes = request.DurationMinutes;
        service.Price = request.Price;
        service.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(service));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var service = await _context.Services.FindAsync(id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        _context.Services.Remove(service);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static ServiceResponse MapToResponse(Service s) => new()
    {
        Id = s.Id,
        CategoryId = s.CategoryId,
        CategoryName = s.Category.Name,
        Name = s.Name,
        Description = s.Description,
        DurationMinutes = s.DurationMinutes,
        Price = s.Price,
        IsActive = s.IsActive,
        CreatedAt = s.CreatedAt,
        Elements = s.Elements.Select(e => new ElementResponse
        {
            Id = e.Id,
            Name = e.Name,
            OrderIndex = e.OrderIndex,
            ExtraPrice = e.ExtraPrice
        }).ToList()
    };
}
