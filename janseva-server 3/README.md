# JanSeva Backend (`janseva-server`)

> **If you have any older `janseva-backend` / `janseva-backend 2` / `janseva-backend 3`
> folders on your machine, delete them.** This project was deliberately renamed
> to `janseva-server` so it can never be confused with an older download.
> This is the current, complete version - H2 by default (no profile needed),
> `ddl-auto: create-drop` (guaranteed fresh schema every restart), Jackson/
> Hibernate proxy serialization fixed, TEXT columns for uploaded images.

Spring Boot REST API for **JanSeva – Citizen Service & Grievance Redressal Portal**.
Implements the full citizen certificate approval chain (VAO → RI → Tahsildar),
AI-assisted grievance redressal, and Administrator-driven officer onboarding,
matching the database design and frontend prototype built earlier for this project.

## Stack

| Layer          | Technology                                    |
|----------------|------------------------------------------------|
| Language       | Java 17                                        |
| Framework      | Spring Boot 3.2.5                              |
| Data access    | Spring Data JPA (Hibernate)                    |
| Database       | H2 (in-memory, default) / PostgreSQL (`postgres` profile) |
| Auth           | JWT (`io.jsonwebtoken`) + Spring Security, BCrypt passwords |
| QR codes       | ZXing                                          |
| API docs       | springdoc-openapi (Swagger UI)                 |
| Build          | Maven                                          |

## Project Layout

```
src/main/java/com/janseva/backend/
├── JanSevaBackendApplication.java   entry point
├── model/          14 JPA entities (Citizen, Officer, Department, GovService,
│                   CertificateApplication, ApplicationDocument,
│                   ApplicationStatusHistory, Certificate, GrievanceCategory,
│                   Grievance, GrievanceStatusHistory, AIProcessingLog,
│                   Notification, AuditLog)
├── repository/     Spring Data JPA repositories, one per entity
├── service/        business logic (Auth, AdminOfficer, Application, Grievance,
│                   AIProcessing, Certificate, Notification, Analytics, ...)
├── controller/     REST controllers, one per resource
├── dto/            request/response payloads (Java records)
├── security/       JwtUtil, JwtAuthFilter, AuthContext, CurrentUserResolver
├── config/         SecurityConfig, OpenApiConfig, DataSeeder
├── exception/      custom exceptions + GlobalExceptionHandler
└── util/           IdGenerator (employee/application/grievance IDs, OTPs,
                     temp passwords), QrCodeUtil
```

This mirrors the Database Design document and the JanSeva portal UI exactly —
every entity, workflow stage and role from those documents has a corresponding
model, endpoint and service method here.

## Running it

**Requirements:** JDK 17+, Maven 3.9+ (or use the included `mvnw` if you add
the wrapper jar — network-restricted sandboxes can't download it, so if
`./mvnw` is missing, just use a locally installed `mvn`).

```bash
mvn spring-boot:run
```

That's it — the app boots on `http://localhost:8080` using an **in-memory H2
database that requires no profile and no setup at all** (it's simply the
default in `application.yml`), and `DataSeeder` automatically creates
reference data and one demo login per role on first startup.

To use your own PostgreSQL instead, explicitly opt into the `postgres`
profile (H2 is otherwise always used, regardless of environment quirks):

```bash
createdb janseva
mvn spring-boot:run -Dspring-boot.run.profiles=postgres \
    -DDB_URL=jdbc:postgresql://localhost:5432/janseva \
    -DDB_USERNAME=postgres -DDB_PASSWORD=yourpassword
```
(In IntelliJ: put `postgres` in the run configuration's "Active profiles"
field, and the `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` in "Environment variables".)

If you activate `postgres` and already have a `janseva` database from an
earlier experiment, make sure it's empty (`DROP DATABASE janseva; CREATE
DATABASE janseva;`) so `DataSeeder` can populate it fresh — it only seeds
once, skipping silently if it finds existing rows.

**Swagger UI:** `http://localhost:8080/swagger-ui.html`
**H2 console:** `http://localhost:8080/h2-console`
(JDBC URL `jdbc:h2:mem:jansevadb`, user `sa`, empty password)

⚠️ This sandbox has no access to Maven Central, so `mvn` has not been run
here to verify the build. The code was written and reviewed carefully by
hand, but please run `mvn clean install` yourself as a first step and let me
know if anything doesn't compile — happy to fix it immediately.

## Demo credentials (seeded automatically)

| Role               | Login              | Password    |
|--------------------|---------------------|-------------|
| Citizen            | mobile `9876543210` | `Passw0rd!` |
| Administrator      | Employee ID `ADM20260001` | `Passw0rd!` |
| VAO                | `VAO20260001`        | `Passw0rd!` |
| RI                 | `RI20260001`         | `Passw0rd!` |
| Tahsildar          | `TAH20260001`        | `Passw0rd!` |
| Department Officer | `DPT20260001`        | `Passw0rd!` |
| Field Officer      | `FLD20260001`        | `Passw0rd!` |
| Grievance Officer  | `GRO20260001`        | `Passw0rd!` |

Officer accounts seeded this way have `firstLogin=false` so you can test
immediately. Any officer created via the **Admin → Create Officer** endpoint
gets a real random Employee ID + temporary password and `firstLogin=true`,
exactly as described in the officer-onboarding workflow.

## Authentication flow

**Citizens** (self-registration allowed):
```
POST /api/auth/register          { fullName, mobile, email, password, district, ward }
POST /api/auth/login/citizen     { identifier, password }   -> JWT
```

**Officers** (never self-register — only an Administrator can create an account)
use a two-step login with 2FA:
```
POST /api/auth/login/officer/step1        { identifier: employeeId, password } -> OTP sent
POST /api/auth/login/officer/verify-otp   { identifier: employeeId, otp }       -> JWT (firstLogin flag included)
POST /api/auth/officer/change-password    { identifier, newPassword, confirmPassword }  (required if firstLogin=true)
```

OTPs are generated and logged to the console (`OtpService`) rather than sent
through a real SMS/email gateway — swap in Twilio/SES etc. in
`NotificationService.send()` for production.

Every protected endpoint expects `Authorization: Bearer <token>`.

## Key endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Guest | Citizen self-registration |
| POST | `/api/auth/login/citizen` | Guest | Citizen login |
| POST | `/api/auth/login/officer/step1` → `/verify-otp` | Guest | Officer 2FA login |
| POST | `/api/admin/officers` | Administrator | **Create officer** (auto Employee ID + temp password, Email+SMS) |
| PATCH | `/api/admin/officers/{id}/deactivate` \| `/activate` | Administrator | Enable/disable an officer |
| POST | `/api/admin/officers/{id}/reset-password` | Administrator | Force a new temp password |
| GET | `/api/services` | Guest | Browse citizen services + SLA |
| GET | `/api/grievance-categories` | Guest | Browse grievance categories + SLA |
| GET | `/api/track/{id}` | Guest | Track any `CS…`/`GR…` ID, no login |
| POST | `/api/applications` | Citizen | Submit a certificate application |
| GET | `/api/applications/mine` | Citizen | My applications |
| POST | `/api/applications/{id}/resubmit` | Citizen | Resubmit after rejection |
| GET | `/api/applications/queue` | VAO/RI/Tahsildar | My verification queue |
| POST | `/api/applications/{id}/approve` \| `/reject` | VAO/RI/Tahsildar | Move the file forward / reject with reason |
| GET | `/api/certificates/verify?certificateNumber=…` | Guest | What scanning the certificate QR resolves to |
| POST | `/api/grievances` | Citizen | Register a complaint → runs AI routing automatically |
| GET | `/api/grievances/{id}/ai-log` | Any authenticated | See the AI's routing decision |
| GET | `/api/grievances/field/mine` | Field Officer | My assigned complaints |
| POST | `/api/grievances/{id}/field-update` | Field Officer | Visit update / mark resolved |
| POST | `/api/grievances/{id}/approve-resolution` | Department Officer | Close a resolved complaint |
| POST | `/api/grievances/{id}/reassign` | Grievance Officer | Override AI assignment |
| GET | `/api/analytics/public` | Guest | Homepage stats |
| GET | `/api/analytics/full` | Admin/Grievance Officer | Full dashboard breakdown |

Full request/response shapes are in Swagger UI once the app is running.

## Changelog

- **Fixed profile-activation bug (4th revision)**: `application.yml` no
  longer relies on `spring.profiles.active: dev` to select the H2 database.
  In at least one real environment, that property silently failed to
  activate ("No active profile set, falling back to default"), and Spring
  Boot fell through to a locally-installed PostgreSQL server instead of the
  intended in-memory H2 - connecting to whatever `janseva` database happened
  to already exist there, with stale or partial data. H2 is now the
  **unconditional default with zero profile dependency**; PostgreSQL is only
  used if you explicitly activate the `postgres` profile.

## Changelog (older)

- **Workflow hardening (3rd revision)**:
  - **No duplicate certificates**: a citizen can no longer submit a second
    application for a service while one is already in-flight or already
    issued (`existsByCitizen_CitizenIdAndService_ServiceIdAndStatusNot`).
    `CertificateService.issue()` is also idempotent as a second safety net.
  - **Mandatory documents enforced server-side**: `ApplicationService`
    compares the uploaded document types against the service's
    `requiredDocuments` list and rejects the submission (`400`, with the
    specific missing document names) if anything is missing - on both
    initial submission and resubmission after a rejection.
  - **Declaration required**: `SubmitApplicationRequest.declarationAccepted`
    must be `true` ("I hereby declare that the information provided by me
    is true"), enforced via `@AssertTrue` + `@Valid` on both submit and
    resubmit endpoints.
  - **Ward-precise field-officer assignment**: `AIProcessingService` now
    matches a new grievance to a field officer in this priority order:
    (1) same department **and** same ward as recorded on that officer's
    account by the Administrator, (2) same department, (3) same ward in
    any department, (4) round-robin fallback. This is what makes a
    complaint actually land on the correct staff member's dashboard.
  - **Photo evidence required to close a grievance**: a field officer can't
    mark a complaint `RESOLVED` without attaching a geo-tagged photo, and a
    department officer can't approve/close it without that same photo
    being present - the literal "cross-verify before closing" step.

## Changelog (previous revision)

- **Fixed a lazy-loading bug** (2nd revision): `spring.jpa.open-in-view` is now
  `true` (Spring Boot's default). It was originally set to `false` for
  "best practice," but several controllers return JPA entities directly
  (e.g. `CertificateApplication` with lazy `citizen`/`service`/`currentOfficer`
  associations), and closing the Hibernate session before Jackson serializes
  the response caused `LazyInitializationException` on most GET endpoints.
  With `open-in-view: true`, those associations load correctly within the
  request. (No bidirectional `@OneToMany` back-references exist on any
  entity, so this does not introduce Jackson infinite-recursion risk.)

## Design notes

- **`Applications`/`Grievances` use human-readable string IDs** (`CS2025000123`,
  `GR2025000456`) as their actual primary key — generated by `IdGenerator` —
  so what the citizen sees on the portal is exactly what's stored, no separate
  "display ID" mapping needed.
- **`Officer.createdBy`** is a self-referencing FK, enforcing at the schema
  level that every officer traces back to the Administrator who onboarded them.
- **AI grievance routing is a real, swappable service** (`AIProcessingService`):
  today it uses keyword heuristics for priority and a simple department/ward
  lookup for assignment, but the interface is exactly where you'd plug in a
  real model call.
- **QR codes are generated server-side** with ZXing and returned as base64 PNG
  (`Certificate.qrCodeData`); the QR encodes a verification URL that resolves
  via the public `GET /api/certificates/verify` endpoint.
- **Notifications are persisted, not just logged** — every Email/SMS/in-app
  event is written to the `notifications` table via `NotificationService`, so
  a citizen's/officer's notification history is queryable.

## What's intentionally simplified for a project build

- OTP store is in-memory (`ConcurrentHashMap`), not Redis — fine for a single
  instance; swap for Redis before scaling to multiple app instances.
- SMS/Email "sending" just logs to the console and saves a `Notification` row.
- The digital signature on a certificate is a SHA-256 hash stand-in, not a
  real PKI signature — swap `CertificateService.signPayload()` for actual
  signing (e.g. a HSM or a private key) if this goes further than a project.
