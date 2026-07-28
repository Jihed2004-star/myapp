# Reservo — UI/UX Redesign Handoff

## Role of this document
This is a handoff for whoever (human or AI) continues this work. It covers: what Reservo is, the constraints you must operate under, the design system already established, every file already redesigned, decisions made along the way (and why), open questions, and what's left.

---

## 1. What Reservo is

A generalized, vertical-agnostic service booking marketplace (like a mini Calendly/Airbnb hybrid) — a 1–2 month internship deliverable. Providers list bookable offerings, Clients browse and book time slots via an interactive calendar.

**Domain model:**
`Category` (Admin-managed) → `Service` (Provider-created, has `bookingUnit`: Hourly/Daily/Monthly) → `Element` (Provider-created, the actual bookable unit — has `price` + a free-form `attributes: Record<string,string>`).
`Availability` = provider-defined open windows per Element. `Booking` = a Client's confirmed reservation. Roles: Customer, Provider, Admin (Admin inherits Provider).
Categories/Services/Elements all have `isActive` (soft-disable, not delete).

**Tech stack:**
- Frontend: React + Vite + TypeScript, React Router, Axios, TanStack React Query, **Tailwind CSS v4 (CSS-first — no `tailwind.config.js`)**
- Calendar: FullCalendar (`@fullcalendar/react`, `daygrid`, `timegrid`, `interaction`)
- Backend: ASP.NET Core (.NET 10) + EF Core/Npgsql, PostgreSQL — **out of scope for this work**

## 2. Role & hard constraints (do not violate these)

This is a **UI/UX-only** engagement on an existing, fully functional app.

- **No backend changes.** No new API calls, no changed request/response shapes, no new fields.
- **No changed business logic.** Ownership checks, role gating, validation, mutation success/error handling stay exactly as-is. Only JSX/styling/component structure changes.
- **Preserve all existing `react-query` hooks, mutations, and state logic exactly** — restyle the same data flow, don't rebuild it.
- **Ask before** changing what data is fetched, when, or how errors are handled.
- **Don't add UI elements that don't map to real backend functionality.** The Figma reference images used throughout this project are a generic car-rental template and contain a lot of content the app doesn't support (see §5, "Fictional content stripped out").

## 3. Design system established so far

**Palette** (standard Tailwind classes — no custom tokens needed since these map almost exactly to the Figma hex values):
- Primary: `indigo-600` (`#4F46E5`) — buttons, active nav state, price text, links
- Accent: `rose-400`/`rose-500` (`#FB7185`-ish) — cancelled/destructive states
- Background: `white`, with `slate-50` for muted panel backgrounds
- Borders: `slate-200`
- Text hierarchy: `slate-900` (headings) → `slate-700`/`slate-600` (body) → `slate-500` (secondary) → `slate-400` (muted/placeholder)
- Status colors: emerald (active/success), rose (cancelled/error), amber (warnings), indigo (confirmed), slate (inactive/neutral)

**Shape/spacing:**
- Buttons & inputs: `rounded-xl`
- Cards & panels: `rounded-2xl`
- Badges/pills: `rounded-full`
- Cards: `border border-slate-200`, `shadow-sm hover:shadow-md transition-shadow`

**Branding:** App name "Reservo," calendar-check icon as the logo mark.

**Origin:** Login/Register pages were redesigned *before* this session (not part of this handoff's work log) using a shared `AuthLayout.tsx` with a split-screen layout and a custom SVG illustration (deliberately not the Figma template's stock 3D illustration, to avoid reproducing licensed assets). All work in this session extends that direction to the rest of the app.

## 4. Reusable components built (all in `client/src/components/`)

| File | Purpose |
|---|---|
| `components/ui/Badge.tsx` | `Badge` (variants: active/inactive/confirmed/cancelled/completed) + `StatusBadge` convenience wrapper for the `isActive` boolean |
| `components/ui/Card.tsx` | Shared card shell: blank image slot (see §6), corner badge slot, footer button/link. Takes `children` for variant-specific middle content |
| `components/ui/TagIcon.tsx` | Generic inline-SVG icon used for attribute rows (chosen over a curated per-key icon map — see §7) |
| `components/ui/LogoMark.tsx` | Extracted shared logo SVG — originally duplicated inline in `Navbar` and `Footer`, pulled out into one file (see §7) |
| `components/ui/CardSkeleton.tsx` | `CardSkeleton` + `CardSkeletonGrid` loading placeholders, reused across all list pages |
| `components/cards/CategoryCard.tsx` | Wraps `Card` for `Category` — name, description, status. No price/attributes (they don't exist on this type) |
| `components/cards/ServiceCard.tsx` | Wraps `Card` for `Service` — categoryName, name, description, element count, bookingUnit badge, status. No price (lives on Element, not Service) |
| `components/cards/ElementCard.tsx` | Wraps `Card` for `Element` — name, price + bookingUnit suffix, up to 3 attributes (generic icon + value), status |
| `components/Navbar.tsx` | Restyled light theme. **Same props/logic as original** (`useAuth`, `logout`, role-gated links). Real nav items only: Home, My Bookings, Dashboard, Users, Categories, role chip, login/logout. `Link` → `NavLink` for active-state styling |
| `components/Footer.tsx` | **New component** (didn't exist before). Stripped down from the Figma reference to only real content: logo+tagline, Navigate links (Categories always; My Bookings if logged in, else Login/Register), placeholder support email (`support@reservo.app`) |

## 5. Pages redesigned so far

| File | Status | Notes |
|---|---|---|
| `pages/Home.tsx` | Rebuilt | Real copy (no lorem ipsum), abstract SVG hero illustration (no stock car photo — see §6), 3-feature strip, real "How it works" 4-step process, static "Browse categories" CTA. Renders `<Footer />` only (not `<Navbar />` — see §8 open question) |
| `pages/Categories.tsx` | Restyled | `CategoryCard` grid + client-side name search (filters already-fetched data, **no new API call**) + skeleton/error/empty states. Same `useQuery(['categories'], getCategories)` |
| `pages/Services.tsx` | Restyled | `ServiceCard` grid, same search/skeleton/empty pattern, back link to `/Categories`. Same `useQuery(['services', categoryId], ...)` |
| `pages/ServiceDetail.tsx` | Restyled | `ElementCard` grid, same pattern, back link to `/categories/{categoryId}/services`, status badge added. Same `useQuery(['service', id], ...)` |
| `pages/ElementDetail.tsx` | Restyled | **Most functionally significant page** — FullCalendar + all hooks/mutations/handlers preserved byte-for-byte. Added: calendar legend (available/booked dots), booking summary card (replaces plain `<p>Selected...</p>` text), image placeholder, attributes list restyled with `TagIcon`. One **new** UI-only affordance: a "Clear selection" button that resets local `startTime`/`endTime` state only — doesn't touch the mutation or queries |
| `index.css` | Extended | Added `.fc-light-theme` CSS block (FullCalendar theming) alongside the pre-existing `.fc-dark-theme` (left untouched, not deleted — see §8). Also added `.fc-highlight` override so the drag-to-select highlight uses indigo instead of FullCalendar's default blue |

### Fictional content stripped out along the way
Every Figma reference screenshot provided was a generic car-rental template with content that doesn't map to Reservo's actual backend. Consistently removed/replaced:
- Header: "Vehicles / Details / About Us / Contact Us" nav + phone-support widget → real nav items only
- Footer: address, phone, social icons, "Useful links" (About/Contact/Gallery/Blog/FAQ), hardcoded "Vehicles" list, App Store/Google Play badges → real routes + placeholder email only
- Homepage: stock car hero photo, lorem ipsum paragraphs, fabricated "540+ Cars / 20k+ Customers / 25+ Years / 20m+ Miles" stats, hardcoded Mercedes/Porsche/Toyota cards → real copy, abstract illustration, no invented numbers
- Categories page: the reference actually showed **Element-level data** (price, attributes) styled as "category" cards, plus vehicle-type filter pills (Sedan/Cabriolet/SUV/etc.) with no backing field on `Category` → real `CategoryCard` (name/description/status only) + name search instead of fake type filters
- Element detail: plain month date-picker (would have replaced real FullCalendar functionality), 3 fake photo thumbnails, duplicated "ABS / ABS" equipment list → FullCalendar preserved, blank image slot, attributes list driven by real data

## 6. Images — current state

**No `imageUrl` field exists yet on `Category`, `Service`, or `ElementItem`.** Per the user's direction, every card/detail page has a **blank placeholder slot** (icon on a `slate-50` background) rather than fake stock photography. `Card.tsx` already has an optional `imageUrl` prop wired up and ready — once the field is added to the types and API, each `*Card` variant just needs `imageUrl={category.imageUrl}` (etc.) added to its `<Card>` call. No structural changes needed at that point.

## 7. Notable decisions made during this session

- **Attribute icons**: `Element.attributes` is a generic `Record<string,string>` (vertical-agnostic — could be car specs today, haircut details tomorrow). Decided against a curated per-key icon map; every attribute gets the same generic `TagIcon`. (User's explicit choice.)
- **LogoMark duplication caught and fixed**: it was initially written inline in both `Navbar.tsx` and `Footer.tsx`. Extracted to `components/ui/LogoMark.tsx`, both files now import it. This was flagged as an example of *why* components exist (reuse + single point of change), not just an aesthetic choice.
- **Footer is per-page, Navbar is (assumed) global**: User confirmed Footer should be imported and rendered inside each page component individually (`<Footer />` at the bottom of each page's JSX). Navbar is *not* imported per-page — the working assumption is it's mounted once in a layout wrapper (e.g. `App.tsx`), consistent with the original brief's note that the navbar is "hidden on `/login` and `/register`" (logic that must live above individual pages). **This assumption is unconfirmed — `App.tsx` has never been shared.**
- **Client-side search added to all three browse pages** (Categories/Services/ServiceDetail's elements): filters already-fetched React Query data in-memory, no new network requests. User approved this explicitly for Categories; same pattern was then carried to Services/ServiceDetail for consistency.

## 8. Open questions / unverified assumptions for whoever continues this

1. **`App.tsx` / root layout has never been shared.** Where exactly `<Navbar />` is mounted, and the `/login`+`/register` hiding logic, are unconfirmed.
2. **`AuthLayout.tsx`'s actual logo SVG has never been shared.** `LogoMark.tsx` is a best-guess "calendar-check" icon matching the *description* of the original. If the real one differs, `LogoMark.tsx` should be updated to match exactly (it's now the single source of truth, so this is a one-file fix).
3. **`ElementCard`'s route (`/elements/:id`) is unconfirmed** — unlike `CategoryCard` and `ServiceCard`'s routes, which were verified against real uploaded page files.
4. **Home.tsx's category section is a static CTA, not live data.** Wiring in real featured categories would mean a new data-fetching call on the homepage — flagged as a scope decision, not yet made.
5. **Unresolved bug report**: user said "services are not showing" on `Services.tsx` after it was restyled. Diagnosis pointed at three possibilities (console error / empty API response / route param name mismatch between `:categoryId` in the component and whatever the router actually defines) but **no root cause was confirmed or fixed** — the styling/logic in `Services.tsx` itself was not changed as part of that conversation. Whoever continues should verify this is resolved before doing further work on that page.
6. **The "Clear selection" button on `ElementDetail.tsx`** was added as a new (UI-state-only) affordance not present in the original file. Flagged to the user; no objection raised, but not explicitly confirmed either.
7. **`.fc-dark-theme` in `index.css` was left in place**, not deleted — `ManageElement.tsx` (provider-side calendar) hasn't been redesigned yet and may still depend on it. Decide whether to migrate it to `.fc-light-theme` when that page is tackled.

## 9. Not yet started

From the original full page list, still on the original dark theme / unstyled:
- `MyBookings.tsx`
- `ProviderDashboard.tsx`
- `CreateService.tsx`
- `ManageService.tsx`
- `ManageElement.tsx` (has its own FullCalendar instance + an availability-pattern generator form — will need the same `.fc-light-theme` + legend/summary treatment as `ElementDetail.tsx`)
- `UserManagement.tsx`
- `CategoryManagement.tsx`
- A proper sidebar for Provider/Admin dashboards (currently just top-nav links) — one of the 5 original asks, not started
- Consistent form input styling for the various create/manage forms

## 10. Working conventions to keep

- Output files are written to mirror `client/src/` structure (`components/`, `pages/`, `index.css`) so they can be dropped straight into the real repo.
- Always ask before changing data-fetching behavior; state assumptions explicitly when a route/prop/field can't be verified against an uploaded file.
- When the Figma reference includes something with no backing functionality, strip it and say so — don't build dead-end UI.
- New shared visual patterns (skeletons, badges, icons) get extracted into `components/ui/` rather than duplicated per page — this was corrected once already (see `LogoMark`) and should be watched for going forward.
