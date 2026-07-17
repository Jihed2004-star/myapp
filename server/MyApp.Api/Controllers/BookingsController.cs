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
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BookingsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<BookingResponse>> Create(BookingRequest request)
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

        var userId = GetCurrentUserId();

        var requestedRange = new NpgsqlRange<DateTime>(request.StartTime, true, request.EndTime, false);

        var isWithinAvailability = await _context.Availabilities
            .Where(a => a.ElementId == request.ElementId)
            .AnyAsync(a => a.TimeRange.Contains(requestedRange));

        if (!isWithinAvailability)
        {
            return BadRequest(new { message = "The requested time is outside this element's available slots." });
        }

        var booking = new Booking
        {
            UserId = userId,
            ElementId = request.ElementId,
            TimeRange = requestedRange,
            Status = "Confirmed"
        };

        _context.Bookings.Add(booking);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsExclusionViolation(ex))
        {
            return Conflict(new { message = "This element is already booked for the selected time range." });
        }

        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, MapToResponse(booking, element));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<BookingResponse>>> GetMine()
    {
        var userId = GetCurrentUserId();

        var bookings = await _context.Bookings
            .Include(b => b.Element).ThenInclude(e => e.Service)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(bookings.Select(b => MapToResponse(b, b.Element)).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookingResponse>> GetById(Guid id)
    {
        var booking = await _context.Bookings
            .Include(b => b.Element).ThenInclude(e => e.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        if (!CanManage(booking))
        {
            return Forbid();
        }

        return Ok(MapToResponse(booking, booking.Element));
    }

    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<BookingResponse>> Cancel(Guid id)
    {
        var booking = await _context.Bookings
            .Include(b => b.Element).ThenInclude(e => e.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        if (!CanManage(booking))
        {
            return Forbid();
        }

        if (booking.Status != "Confirmed")
        {
            return BadRequest(new { message = $"Booking is already {booking.Status}, cannot cancel." });
        }

        booking.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(booking, booking.Element));
    }

    // A booking can be managed by: the Client who made it, the Provider who owns
    // the Element being booked, or an Admin.
    private bool CanManage(Booking booking)
    {
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = GetCurrentUserId();

        return booking.UserId == currentUserId
               || booking.Element.Service.ProviderId == currentUserId;
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")!.Value;
        return Guid.Parse(value);
    }

    private static bool IsExclusionViolation(DbUpdateException ex)
    {
        // Postgres SQLSTATE 23P01 = exclusion_violation
        return ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23P01";
    }

    private static BookingResponse MapToResponse(Booking b, Element element) => new()
    {
        Id = b.Id,
        ElementId = b.ElementId,
        ElementName = element.Name,
        ServiceName = element.Service.Name,
        StartTime = b.TimeRange.LowerBound,
        EndTime = b.TimeRange.UpperBound,
        Status = b.Status,
        CreatedAt = b.CreatedAt
    };
}