using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Data;
using MyApp.Data.Entities;
using System.Security.Claims;

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
            query = query.Where(s => s.IsActive);
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
    [HttpGet("mine")]
    public async Task<ActionResult<List<ServiceResponse>>> GetMine()
    {
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);

        var query = _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
            .AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            query = query.Where(s => s.ProviderId == currentUserId);
        }

        var services = await query.Select(s => MapToResponse(s)).ToListAsync();

        return Ok(services);
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

        var providerId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")!.Value);

        var service = new Service
        {
            CategoryId = request.CategoryId,
            ProviderId = providerId,
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            BookingUnit = request.BookingUnit
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
        
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && service.ProviderId != currentUserId)
        {
            return Forbid();
        }
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "CategoryId does not reference an existing category." });
        }
      if (request.BookingUnit != service.BookingUnit)
        {
            bool hasExistingData = await _context.Elements
                .Where(e => e.ServiceId == service.Id)
                .AnyAsync(e =>
                    _context.Availabilities.Any(a => a.ElementId == e.Id) ||
                    _context.Bookings.Any(b => b.ElementId == e.Id));

            if (hasExistingData)
            {
                return Conflict(new { message = "Cannot change booking granularity while existing availability or bookings are present. Clear them first." });
            }
        }
        service.CategoryId = request.CategoryId;
        service.Name = request.Name;
        service.Description = request.Description;
        service.IsActive = request.IsActive;
        service.BookingUnit = request.BookingUnit;

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(service));
    }


    [Authorize(Roles = "Provider,Admin")] 
    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ServiceResponse>> ToggleActive(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && service.ProviderId != currentUserId)
        {
            return Forbid();
        }

        service.IsActive = !service.IsActive;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(service));
    }



    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var service = await _context.Services.FindAsync(id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && service.ProviderId != currentUserId)
        {
            return Forbid();
        }
        _context.Services.Remove(service);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Cannot delete this service while its elements have booking history. Remove or archive bookings first." });
        }

        return NoContent();
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        // Postgres SQLSTATE 23503 = foreign_key_violation
        return ex.InnerException is Npgsql.PostgresException pgEx && (pgEx.SqlState == "23503" || pgEx.SqlState == "23001");
    }
    


    private static ServiceResponse MapToResponse(Service s) => new()
    {
        Id = s.Id,
        CategoryId = s.CategoryId,
        ProviderId = s.ProviderId,
        CategoryName = s.Category.Name,
        Name = s.Name,
        Description = s.Description,
        IsActive = s.IsActive,
        CreatedAt = s.CreatedAt,
        BookingUnit = s.BookingUnit,
        Elements = s.Elements.Select(e => new ElementResponse
        {
            Id = e.Id,
            ServiceId = e.ServiceId,
            Name = e.Name,
            OrderIndex = e.OrderIndex,
            Price = e.Price,
            Attributes = e.Attributes,
            BookingUnit = s.BookingUnit,
            IsActive = e.IsActive
        }).ToList()
    };
}
