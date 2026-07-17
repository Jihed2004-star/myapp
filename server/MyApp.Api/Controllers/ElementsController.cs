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
        var query = _context.Elements.AsQueryable();

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

    [HttpGet("{id}")]
    public async Task<ActionResult<ElementResponse>> GetById(Guid id)
    {
        var element = await _context.Elements.FindAsync(id);

        if (element is null)
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
        await _context.SaveChangesAsync();

        return NoContent();
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

    private static ElementResponse MapToResponse(Element e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        OrderIndex = e.OrderIndex,
        Price = e.Price,
        Attributes = e.Attributes
    };
}
