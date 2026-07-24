using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Data;
using MyApp.Data.Entities;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ElementsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ElementsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ElementResponse>>> GetAll([FromQuery] Guid? serviceId)
    {
        var query = _context.Elements
            .Include(e => e.Service)
            .Where(e => e.IsActive && e.Service.IsActive)
            .AsQueryable();

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.ServiceId == serviceId.Value);
        }

        var elements = await query
            .OrderBy(e => e.OrderIndex)
            .Select(e => MapToResponse(e))
            .ToListAsync();

        return Ok(elements);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ElementResponse>> GetById(Guid id)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        var isInactive = !element.IsActive || !element.Service.IsActive;

        if (isInactive && !IsOwnerOrAdminIfAuthenticated(element.Service.ProviderId))
        {
            return NotFound(new { message = "Element not found." });
        }

        return Ok(MapToResponse(element));
    }
    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    public async Task<ActionResult<ElementResponse>> Create(ElementRequest request)
    {
        var service = await _context.Services.FindAsync(request.ServiceId);
        if (service is null)
        {
            return BadRequest(new { message = "ServiceId does not reference an existing service." });
        }

        if (!IsOwnerOrAdmin(service.ProviderId))
        {
            return Forbid();
        }

        var element = new Element
        {
            ServiceId = request.ServiceId,
            Name = request.Name,
            OrderIndex = request.OrderIndex,
            Price = request.Price,
            Attributes = request.Attributes
        };

        _context.Elements.Add(element);
        await _context.SaveChangesAsync();
        await _context.Entry(element).Reference(e => e.Service).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = element.Id }, MapToResponse(element));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ElementResponse>> Update(Guid id, ElementRequest request)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        element.Name = request.Name;
        element.OrderIndex = request.OrderIndex;
        element.Price = request.Price;
        element.Attributes = request.Attributes;

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(element));
    }




    [Authorize(Roles = "Provider,Admin")]
    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ElementResponse>> ToggleActive(Guid id)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        element.IsActive = !element.IsActive;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(element));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        _context.Elements.Remove(element);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Cannot delete this element while it has booking history." });
        }

        return NoContent();
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        // Postgres SQLSTATE 23503 = foreign_key_violation
        return ex.InnerException is Npgsql.PostgresException pgEx  && (pgEx.SqlState == "23503" || pgEx.SqlState == "23001");
    }

    

    private bool IsOwnerOrAdmin(Guid ownerProviderId)
    {
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);

        return currentUserId == ownerProviderId;
    }
  private bool IsOwnerOrAdminIfAuthenticated(Guid ownerProviderId)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);

        return currentUserId == ownerProviderId;
    }
    private static ElementResponse MapToResponse(Element e) => new()
    {
        Id = e.Id,
        ServiceId = e.ServiceId,
        Name = e.Name,
        OrderIndex = e.OrderIndex,
        Price = e.Price,
        Attributes = e.Attributes,
        BookingUnit = e.Service.BookingUnit,
        IsActive = e.IsActive,
    };
}
