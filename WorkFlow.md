# 🔐 Authentication Flow: Registration, Login & Token Verification

A walkthrough of how a user goes from "no account" to "fully authenticated request," using JWT + BCrypt in an ASP.NET Core + PostgreSQL setup.

---

## 🧭 Overview

Both **Registration** and **Login** end the exact same way:

> **Verify the person → hand them a signed token.**

The only difference between them is *how* the person is verified:

| Flow | How identity is established |
|------|-------------------------------|
| **Register** | No existing account check needed except "email not already taken" — identity is created on the spot |
| **Login** | Identity is proven by matching the given password against an existing stored hash |

Everything downstream — JWT generation, using the token on future requests — is **identical** in both paths.

---

## Part 1 — Registration (no account yet)

### 1. Client sends a request

```http
POST /api/auth/register
{ "email": "joe@test.com", "password": "mypassword123", "fullName": "Joe" }
```

### 2. `AuthController.Register()` checks for a duplicate email

```csharp
var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
if (existingUser is not null) return Conflict(...);
```

No user with that email exists yet → proceed.

### 3. Password gets hashed

```csharp
PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
```

- `"mypassword123"` → becomes something like `$2a$11$K9x7...`
- This is **one-way and unrecoverable**
- The raw password is discarded from memory right after this line — it is **never stored anywhere**

### 4. New `User` row saved to Postgres

```csharp
_context.Users.Add(user);
await _context.SaveChangesAsync();
```

A row now exists in `"Users"` with:
- `Role = "Customer"` *(hardcoded)*
- The hashed password
- A new `Id` (Guid)

### 5. A JWT is generated immediately

```csharp
var token = _jwtService.GenerateToken(user);
```

Since the user is already verified — they just created the account — they're logged in right away. **No separate login step is required after registering.**

The token is signed with `Jwt:Secret` and contains claims:
- `userId`
- `email`
- `role: Customer`
- expiry timestamp

### 6. Response sent back

```json
{ "token": "eyJhbGciOi...", "email": "joe@test.com", "fullName": "Joe", "role": "Customer" }
```

The client stores this token (e.g. in memory / localStorage on the frontend).

---

## Part 2 — Logging in later (already has an account)

> Joe closes the app, comes back the next day. His old token might still be valid (24hr expiry) or might have expired — either way, say he explicitly logs in again.

### 1. Client sends a request

```http
POST /api/auth/login
{ "email": "joe@test.com", "password": "mypassword123" }
```

### 2. `AuthController.Login()` looks up the user

```csharp
var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
```

Finds Joe's row by email — his stored `PasswordHash` comes back with it.

### 3. Password verification (**not** decryption)

```csharp
if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
```

`BCrypt.Verify` re-hashes `"mypassword123"` using the same salt embedded in the stored hash, then compares the two hashes.

> ⚠️ **Important distinction:** This is a **re-hash-and-compare**, not a decrypt. The original stored hash is never reversed.

If they match → password is correct.

### 4. New JWT generated

Same as registration — a fresh token, fresh expiry timestamp, same claims (`userId`, `email`, `role`).

### 5. Response returned

Same shape as registration's response.

---

## Part 3 — Using the token on a protected request afterward

### 1. Client calls a protected endpoint

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOi...
```

### 2. `UseAuthentication()` runs

- Decodes the token
- Verifies signature using `Jwt:Secret` → confirms it wasn't forged/tampered
- Checks `ValidateLifetime` → confirms it hasn't expired
- If all valid → populates `HttpContext.User` with Joe's claims

### 3. `UseAuthorization()` runs

- Endpoint has `[Authorize]` (no specific role required)
- Just checks: **"is this request authenticated at all?"** → yes → allowed through

### 4. Controller method runs

Returns Joe's info.

---

## 🔑 Key Takeaway

| Stage | Register | Login |
|-------|----------|-------|
| Identity check | Email not taken | Password matches stored hash |
| Password handling | Hash & store | Verify (re-hash & compare) |
| Token generation | ✅ Immediate | ✅ Immediate |
| Token contents | `userId`, `email`, `role`, expiry | `userId`, `email`, `role`, expiry |
| Response shape | Same | Same |

Both flows converge on the same output: **a signed JWT that proves "this request belongs to this authenticated user."** Everything after issuance — decoding, signature verification, expiry checks, and authorization — is handled identically regardless of which path got the user there.