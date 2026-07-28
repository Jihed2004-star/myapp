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
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet("by-element/{elementId}")]
    public async Task<ActionResult<List<ReviewResponse>>> GetByElement(Guid elementId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.ElementId == elementId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse
            {
                Id = r.Id,
                ElementId = r.ElementId,
                BookingId = r.BookingId,
                ReviewerName = r.User.FullName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [AllowAnonymous]
    [HttpGet("summary/{elementId}")]
    public async Task<ActionResult<ElementRatingSummary>> GetSummary(Guid elementId)
    {
        var ratings = await _context.Reviews
            .Where(r => r.ElementId == elementId)
            .Select(r => r.Rating)
            .ToListAsync();

        return Ok(new ElementRatingSummary
        {
            AverageRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : 0,
            ReviewCount = ratings.Count
        });
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewResponse>> Create(ReviewRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return BadRequest(new { message = "Rating must be between 1 and 5." });
        }

        var userId = GetCurrentUserId();

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);

        if (booking is null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        if (booking.UserId != userId)
        {
            return Forbid();
        }

        if (booking.Status == "Cancelled")
        {
            return BadRequest(new { message = "Cannot review a cancelled booking." });
        }

        if (booking.TimeRange.UpperBound > DateTime.UtcNow)
        {
            return BadRequest(new { message = "You can only review a booking after it has ended." });
        }

        var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.BookingId == request.BookingId);
        if (alreadyReviewed)
        {
            return Conflict(new { message = "This booking has already been reviewed." });
        }

        var review = new Review
        {
            BookingId = booking.Id,
            ElementId = booking.ElementId,
            UserId = userId,
            Rating = request.Rating,
            Comment = request.Comment
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        await _context.Entry(review).Reference(r => r.User).LoadAsync();

        return Ok(new ReviewResponse
        {
            Id = review.Id,
            ElementId = review.ElementId,
            BookingId = review.BookingId,
            ReviewerName = review.User.FullName,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")!.Value;
        return Guid.Parse(value);
    }
}