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
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateAvailabilityResponse>> Generate(GenerateAvailabilityRequest request)
    {
        var isFullDayPattern = request.StartTime == TimeOnly.MinValue && request.EndTime == TimeOnly.MinValue;

        if (!isFullDayPattern && request.EndTime <= request.StartTime)
        {
            return BadRequest(new { message = "EndTime must be after StartTime." });
        }

        if (request.ToDate < request.FromDate)
        {
            return BadRequest(new { message = "ToDate must be on or after FromDate." });
        }

        if (request.DaysOfWeek is null || request.DaysOfWeek.Count == 0)
        {
            return BadRequest(new { message = "At least one day of week must be specified." });
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

        var daysSet = request.DaysOfWeek.ToHashSet();

        // Compute the full date range up front so we only need ONE query
        // to fetch existing rows, instead of one query per candidate date.
        var rangeStart = DateTime.SpecifyKind(request.FromDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var rangeEnd = DateTime.SpecifyKind(request.ToDate.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var boundingRange = new NpgsqlRange<DateTime>(rangeStart, true, rangeEnd, false);

        var existingRanges = await _context.Availabilities
            .Where(a => a.ElementId == request.ElementId && a.TimeRange.Overlaps(boundingRange))
            .Select(a => a.TimeRange)
            .ToListAsync();

        var slotsToCreate = new List<Availability>();
        var skippedCount = 0;

        for (var date = request.FromDate; date <= request.ToDate; date = date.AddDays(1))
        {
            if (!daysSet.Contains(date.DayOfWeek))
            {
                continue;
            }

            var start = DateTime.SpecifyKind(date.ToDateTime(request.StartTime), DateTimeKind.Utc);
            var end = request.EndTime == TimeOnly.MinValue
                ? DateTime.SpecifyKind(date.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc)
                : DateTime.SpecifyKind(date.ToDateTime(request.EndTime), DateTimeKind.Utc);

            var candidate = new NpgsqlRange<DateTime>(start, true, end, false);

            var overlapsExisting = existingRanges.Any(r =>
                start < r.UpperBound && r.LowerBound < end);
            if (overlapsExisting)
            {
                skippedCount++;
                continue;
            }

            slotsToCreate.Add(new Availability
            {
                ElementId = request.ElementId,
                TimeRange = candidate
            });
        }

        _context.Availabilities.AddRange(slotsToCreate);
        await _context.SaveChangesAsync();

        return Ok(new GenerateAvailabilityResponse
        {
            SlotsCreated = slotsToCreate.Count,
            SlotsSkipped = skippedCount,
            FromDate = request.FromDate,
            ToDate = request.ToDate
        });
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
