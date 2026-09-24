# CertiChain Backend — Module 1: Authentication & Authorization

This is the first module of CertiChain: user registration, login, JWT issuance,
and role-based access control (`ADMIN`, `STUDENT`). Everything else in the plan
(certificate CRUD, blockchain service, verification) will sit behind this.

## What's included

```
src/main/java/com/certichain/
  CertiChainApplication.java      - Spring Boot entrypoint
  entity/Role.java                - ADMIN / STUDENT
  entity/User.java                - implements UserDetails directly
  repository/UserRepository.java
  dto/RegisterRequest.java, LoginRequest.java, AuthResponse.java
  service/JwtService.java         - token generation/validation
  service/CustomUserDetailsService.java
  service/AuthService.java        - register/login logic
  config/JwtAuthenticationFilter.java  - reads Bearer token per request
  config/SecurityConfig.java      - filter chain, public routes, BCrypt, CORS
  controller/AuthController.java  - /api/auth/register, /login, /me
  exception/ApiException.java, GlobalExceptionHandler.java
src/main/resources/application.properties
```

## Prerequisites

- Java 17
- Maven 3.9+ (`mvn -v` to check)
- PostgreSQL running locally

## 1. Create the database

```bash
createdb certichain
# or from psql:
psql -U postgres -c "CREATE DATABASE certichain;"
```

Update `src/main/resources/application.properties` if your Postgres
username/password differ from `postgres`/`postgres`.

## 2. Generate a real JWT secret (don't ship the placeholder one)

```bash
openssl rand -base64 32
```

Paste the output into `certichain.security.jwt.secret` in `application.properties`.

## 3. Run it

```bash
mvn spring-boot:run
```

The app starts on `http://localhost:8080`. Hibernate will auto-create the
`users` table on first run (`ddl-auto=update`).

## 4. Try it

**Register an admin:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Institution Admin",
    "email": "admin@college.edu",
    "password": "AdminPass123",
    "role": "ADMIN"
  }'
```

You'll get back a JSON body with a `token`. Copy it.

**Register a student:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Student",
    "email": "jane@college.edu",
    "password": "StudentPass123",
    "role": "STUDENT"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@college.edu", "password": "AdminPass123"}'
```

**Call a protected route with the token:**
```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <paste token here>"
```

You should get back the logged-in user's id/name/email/role. If you strip the
`Authorization` header, you should get a 403 instead.

## How the pieces fit together (for when you extend this)

1. `AuthController` receives the request → validates DTO → calls `AuthService`.
2. `AuthService.register()` hashes the password with BCrypt, saves the `User`,
   and immediately issues a JWT so the client doesn't need a second login call.
3. `AuthService.login()` hands credentials to Spring's `AuthenticationManager`,
   which uses `CustomUserDetailsService` + `DaoAuthenticationProvider` (wired in
   `SecurityConfig`) to check the password hash. On success, issues a JWT.
4. On every subsequent request, `JwtAuthenticationFilter` reads the
   `Authorization: Bearer <token>` header, validates it via `JwtService`, loads
   the `User` via `CustomUserDetailsService`, and puts it into Spring Security's
   context — so `@AuthenticationPrincipal User user` works in any controller,
   and `hasRole('ADMIN')` / `@PreAuthorize` will work in later modules.
5. `SecurityConfig.PUBLIC_ROUTES` already reserves `/api/verify/**` and
   `/api/certificates/*/verify` as open, no-login routes — matching your plan's
   requirement that public verification doesn't require login. Add real
   endpoints there later without touching security config again.

## Wiring this to the next modules

- **Certificate Management / CRUD**: put endpoints under `/api/certificates/**`
  (protected, ADMIN-only for create/revoke) and `/api/certificates/*/verify`
  (already public).
- **Admin-only routes**: prefix with `/api/admin/**` — the security config
  already restricts that path to `ROLE_ADMIN`, or use `@PreAuthorize("hasRole('ADMIN')")`
  on individual controller methods (method security is already enabled).
- **Audit logs**: you can pull the acting user out of
  `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`
  (cast to `User`) inside any service to know who performed an action.

## Known simplifications (fine for a college project, flag if a grader asks)

- No refresh tokens — access token just has a 24h expiry (`expiration-ms`).
- No email verification / password reset flow.
- `ddl-auto=update` instead of migrations — acceptable for a demo, not for production.
- CORS is opened only to `localhost:5173` / `:3000` (Vite/CRA dev servers) —
  update `SecurityConfig.corsConfigurationSource()` when you deploy.
