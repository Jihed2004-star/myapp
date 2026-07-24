# Service Booking Platform — Project Handoff

## Context
I'm Joe, an intern building a full-stack service booking platform as part of an engineering internship. I'm learning .NET while building this (I know some Express/Django, but not deeply). I have a mentor who recommended this stack. I want explanations that go **analogy → concept → code**, using Laravel/Spring Boot/Express comparisons where relevant, and I prefer building one piece at a time with testing before moving on.

## Tech Stack
- **Backend:** .NET 10 (LTS), ASP.NET Core, EF Core + Npgsql
- **Database:** PostgreSQL 18.1
- **Frontend:** React + Vite + TypeScript, React Router, Axios, TanStack React Query, Tailwind CSS v4
- **Auth:** JWT Bearer tokens (single long-lived token, 24h expiry — no refresh tokens, by design for MVP simplicity)

## Repo structure
```
myapp/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── pages/              # One file per screen
│       ├── components/         # Reusable pieces (e.g. Navbar)
│       ├── api/                # All backend calls live here (client.ts, auth.ts, catalog.ts, elements.ts)
│       ├── context/             # AuthContext (global logged-in state)
│       └── types/               # TS interfaces mirroring backend DTOs
├── server/
│   ├── MyApp.sln
│   ├── MyApp.Api/               # Controllers, Program.cs, DTOs, Services (JwtService)
│   └── MyApp.Data/              # Entities, AppDbContext, Migrations
```

## Business domain
A multi-category booking platform. Example: a Provider creates a "Service" (their agency, e.g. "Joe's Car Rental"), which contains multiple "Elements" (the actual bookable items, e.g. individual cars). Clients browse Category → Service → Element, then book a specific Element for a custom date/time range.

### Core entities (all use Guid/UUID primary keys)
- **User** — `Id, Email, PasswordHash, FullName, Role (Customer/Provider/Admin), CreatedAt, UpdatedAt`. Registration always creates a `Customer`; Provider/Admin roles are granted manually (via direct DB update for now — no admin UI yet).
- **Category** — `Id, Name, Description, CreatedAt`. Top-level grouping (e.g. "Car Rental", "Haircuts"). Admin-managed.
- **Service** — `Id, CategoryId, ProviderId, Name, Description, IsActive, CreatedAt`. Represents a Provider's agency/offering. **No Price/Duration here** — those live on Element. One Provider can own multiple Services.
- **Element** — `Id, ServiceId, Name, OrderIndex, Price, Attributes (jsonb Dictionary<string,string>)`. The actual bookable unit (e.g. one specific car). `Attributes` is a flexible schema-less field (e.g. `{"color":"Red","seats":"5"}`) for category-specific data — mapped via an EF Core value converter (`HasConversion` + `JsonSerializer`) to `jsonb`, NOT `hstore` (Npgsql defaults `Dictionary<string,string>` to `hstore` unless explicitly converted).
- **Availability** — `Id, ElementId, TimeRange (tstzrange), CreatedAt`. Providers define open booking windows per Element. One-off ranges only (no recurring patterns).
- **Booking** — `Id, UserId, ElementId, TimeRange (tstzrange), Status (Confirmed/Cancelled/Completed), CreatedAt`. References **Element**, not Service (important — Service is just a container, Element is the real bookable resource).

### Key business rules enforced at the DATABASE level
1. **No double-booking**: Postgres `EXCLUDE USING gist` constraint on `Booking`, scoped to `(ElementId WITH =, TimeRange WITH &&) WHERE (Status = 'Confirmed')`. Requires the `btree_gist` extension. Cancelled bookings don't block new ones since the constraint only checks `Confirmed` rows.
2. **Booking must fall within an Availability window**: checked in `BookingsController.Create` using `NpgsqlRange<T>.Contains()` (translates to Postgres `@>` containment operator) — NOT `EF.Functions.RangeIsSuperset` (doesn't exist).
3. **Ownership enforcement everywhere**: Services/Elements/Availability can only be modified by their owning Provider or an Admin (checked via JWT claims vs `ProviderId`, traced up through the Service relationship for Elements/Availability). Bookings can be managed by the Client who made it, the Provider who owns the Element, or an Admin.

## What's fully built and tested

### Backend (100% done for MVP core)
- Full EF Core schema, migrations applied, exclusion constraint verified working
- `AuthController`: register (hardcodes Role=Customer), login, `/me` (protected test endpoint), BCrypt password hashing, JWT generation (`JwtService`)
- JWT validation middleware + role-based `[Authorize(Roles = "...")]` tested and working
- `CategoriesController`: full CRUD, Admin-only writes, public reads
- `ServicesController`: full CRUD, Provider/Admin writes with ownership checks, includes nested Category name + Elements list, `?categoryId=` filtering
- `ElementsController`: full CRUD, ownership traced through parent Service, JSONB `Attributes` field working
- `AvailabilityController`: create/list/delete slots, Provider-owned
- `BookingsController`: create (with availability containment check + exclusion constraint conflict handling returning clean 409), list mine, get by id, cancel (soft delete via Status change)
- Swagger UI configured with Bearer auth support (note: had to work around several `Microsoft.OpenApi` 2.x breaking changes vs Swashbuckle — final working syntax uses `OpenApiSecuritySchemeReference` and a delegate-based `AddSecurityRequirement`)
- CORS configured for `http://localhost:5173`
- **Note:** API currently runs on plain HTTP (`http://localhost:5294`), `UseHttpsRedirection()` is commented out for local dev

### Frontend (Steps 1-8 of 9 done)
1. ✅ Vite + React + TS scaffold
2. ✅ Folder structure
3. ✅ React Router routing
4. ✅ `api/client.ts` — axios instance, auto-attaches JWT from `localStorage` via request interceptor
5. ✅ `AuthContext` — global user state, persists to `localStorage`, `login()`/`logout()`
6. ✅ Login/Register pages — working, styled (dark slate Tailwind theme per personal style preset)
7. ✅ Browse pages: `Categories.tsx` → `Services.tsx` (filtered by categoryId via `useParams`) → `ServiceDetail.tsx` (shows Elements) → `ElementDetail.tsx` (shows Attributes)
8. ✅ Booking flow: `ElementDetail.tsx` extended with availability slot display + booking form (`useMutation`), handles both 400 (outside availability) and 409 (double-booking) errors distinctly using the backend's actual error messages, invalidates the availability query cache on success
9. ⏳ **NOT YET DONE: "My Bookings" page** — this is the very next step

## Immediate next step
We're mid-way through a new enhancement (see "Active enhancement in progress" below) before returning to Step 9 (My Bookings page, which is still unbuilt).

## Active enhancement in progress: booking granularity + recurring availability + calendar UI

**The problem:** different Service types need different booking granularity — car rental books by day, house rental by day or month, haircuts by hour with a recurring fixed schedule (e.g. "every weekday 8am-5pm"). The original Availability design (one-off `tstzrange` slots, manually added one at a time) doesn't scale to a recurring pattern like a barbershop's daily hours.

**Decisions made:**
1. **Booking granularity is a per-Service setting, not a schema change.** Added a `BookingUnit` enum (`Hourly`, `Daily`, `Monthly`) as a new field on `Service`. The database still just stores `tstzrange` regardless of unit — `BookingUnit` only tells the frontend which calendar view/picker to show. Stored as a string in Postgres via `.HasConversion<string>()` for readability.
2. **Recurring availability = generate real rows, don't store a recurrence rule.** Rejected storing a `RecurrenceRule` concept (day-of-week + time + validity period) because it would require every booking-check code path to understand two kinds of availability (rule-based AND one-off), adding real complexity to logic that's already built and tested. Instead: Provider fills out a pattern form ("Mon-Fri, 8am-5pm, for the next 3 months") and a new endpoint loops through matching dates and bulk-creates individual `Availability` rows — same table, same containment check, same exclusion constraint, zero changes to existing `BookingsController`/`AvailabilityController` logic. Trade-off accepted: this "materializes" many rows (a year of weekdays ≈ 260 rows per Element) but that's cheap for Postgres. Providers manually re-trigger generation periodically to extend the schedule (no background job/scheduler — deliberately kept manual for MVP).
3. **Calendar UI: one library (FullCalendar), not two custom components.** Chosen specifically to minimize total work — FullCalendar can render both a month/day-range selectable view (Daily/Monthly Services) and a time-grid hourly view (Hourly Services) through different "views" of the same library, switched based on the Service's `BookingUnit`.
4. **Known follow-up gap, not yet addressed:** the calendar will show Availability slots but won't visually grey out times other clients have already booked, because there's currently no endpoint exposing other users' booking time ranges (only `/api/bookings/mine` exists, scoped to the caller). The backend's exclusion constraint will still correctly REJECT a conflicting booking attempt regardless — this is a UX polish gap (user finds out after clicking Book, not before), not a data-integrity gap. Plan: add a lightweight endpoint later exposing just `{elementId, startTime, endTime}` for Confirmed bookings (no user info) so the calendar can render them as unavailable.

**Build sequence for this enhancement:**
1. ✅ `BookingUnit` enum created (`MyApp.Data/Entities/BookingUnit.cs`)
2. ✅ `BookingUnit` field added to `Service` entity (default `Hourly`)
3. ⏳ **IN PROGRESS:** EF Core config (`.HasConversion<string>()`) + migration `AddBookingUnitToService` — generated but not yet confirmed/applied
4. ⏳ Update `ServiceRequest`/`ServiceResponse` DTOs + `ServicesController` to include `BookingUnit`
5. ⏳ New endpoint: `POST /api/availability/generate` on `AvailabilityController` — Provider/Admin only, ownership-checked, takes `ElementId`, days-of-week, time-of-day range, date range → bulk-creates `Availability` rows
6. ⏳ Frontend: install FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`)
7. ⏳ Frontend: Provider-facing "generate availability" form calling the new endpoint
8. ⏳ Frontend: replace the plain availability list + manual datetime inputs in `ElementDetail.tsx` with an actual FullCalendar view, switching view type based on `element`'s parent Service's `BookingUnit`

Once this enhancement is done, return to the original **Step 9: My Bookings page** (still not built).

## Known gotchas hit during this build (useful context if similar issues recur)
- **Npgsql `Dictionary<string,string>` defaults to `hstore`**, not `jsonb` — must force via `.HasConversion(JsonSerializer.Serialize/Deserialize)` + `.HasColumnType("jsonb")`
- **`Microsoft.OpenApi` 2.x removed the `.Models` namespace** and changed `OpenApiSecurityScheme.Reference` → requires `OpenApiSecuritySchemeReference(name, document)` with a delegate-based `AddSecurityRequirement`
- **Postgres 15+ revoked default CREATE on `public` schema** — new DB users need explicit `GRANT ALL ON SCHEMA public TO myapp_user;`
- **`dotnet ef database drop` requires DB ownership**, not just granted privileges — use `DROP DATABASE`/`CREATE DATABASE` via the `postgres` superuser instead if it fails
- Database was fully wiped and recreated once mid-project (during the Service/Element field restructuring) — any old test data is gone, always re-seed test Categories/Services/Elements/an Admin user via Swagger after a fresh clone
- Frontend dark theme (`bg-slate-950`) means **every new page needs explicit `text-white`/`text-slate-*` classes** or text is invisible (black-on-black) — this has bitten us more than once

## What's left overall (beyond Step 9)
- Admin dashboard (manage all users/categories, promote Customers to Provider — currently done manually via SQL)
- Provider dashboard (manage their own Services/Elements/Availability through UI instead of Swagger)
- Sandbox/test-mode payment integration (deliberately deferred from MVP)
- Explicitly deferred bonus features: notifications, reviews, search/filtering, image uploads, refund policies
- Docker containerization (currently running Postgres + API locally, not containerized — planned for once schema/API is stable)
- CI/CD pipeline (basic GitHub Actions build check was planned but not yet implemented)
- Specifications document ("cahier des charges") — being built incrementally, separate from these build notes
