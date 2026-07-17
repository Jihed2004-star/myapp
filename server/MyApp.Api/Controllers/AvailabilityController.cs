using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Data;
using MyApp.Data.Entities;
using NpgsqlTypes;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvailabilityController : ControllerBase
{
    private readonly AppDbContext _context;

    public AvailabilityController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<AvailabilityResponse>>> GetAll([FromQuery] Guid elementId)
    {
        var slots = await _context.Availabilities
            .Where(a => a.ElementId == elementId)
            .OrderBy(a => a.TimeRange)
            .Select(a => MapToResponse(a))
            .ToListAsync();

        return Ok(slots);
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    public async Task<ActionResult<AvailabilityResponse>> Create(AvailabilityRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest(new { message = "EndTime must be after StartTime." });
        }

        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == request.ElementId);

        if (element is null)
        {
            return BadRequest(new { message = "ElementId does not reference an existing element." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        var availability = new Availability
        {
            ElementId = request.ElementId,
            TimeRange = new NpgsqlRange<DateTime>(request.StartTime, true, request.EndTime, false)
        };

        _context.Availabilities.Add(availability);
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(availability));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var availability = await _context.Availabilities
            .Include(a => a.Element).ThenInclude(e => e.Service)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (availability is null)
        {
            return NotFound(new { message = "Availability slot not found." });
        }

        if (!IsOwnerOrAdmin(availability.Element.Service.ProviderId))
        {
            return Forbid();
        }

        _context.Availabilities.Remove(availability);
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

    private static AvailabilityResponse MapToResponse(Availability a) => new()
    {
        Id = a.Id,
        ElementId = a.ElementId,
        StartTime = a.TimeRange.LowerBound,
        EndTime = a.TimeRange.UpperBound,
        CreatedAt = a.CreatedAt
    };
}
