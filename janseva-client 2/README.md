# JanSeva Frontend (`janseva-client`)

> **If you have any older `janseva-frontend` folders on your machine, delete
> them.** This project was renamed to `janseva-client` to avoid any confusion
> with an older download. Pair it with the `janseva-server` backend project
> (also freshly renamed) - start that one first.

React + Vite frontend for **JanSeva – Citizen Service & Grievance Redressal Portal**.
Talks to the real `janseva-backend` REST API (no mock data) — every page here
calls an actual endpoint from that project.

## Stack

React 18 · React Router 6 · Axios · Vite · plain CSS (design tokens matching
the JanSeva brand: navy / green / gold, IBM Plex fonts)

## Running it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. During dev, any request to `/api/...` is
automatically proxied to the backend at `http://localhost:8080` (see
`vite.config.js`) — **make sure `janseva-backend` is running first**
(`mvn spring-boot:run` in that project).

For a production build served separately from the backend, copy
`.env.example` to `.env` and set `VITE_API_BASE_URL` to the deployed API
origin, then:

```bash
npm run build
npm run preview
```

## Demo logins

Matches the backend's seeded demo accounts (see `janseva-backend/README.md`):

| Role | Login | Password |
|---|---|---|
| Citizen | mobile `9876543210` | `Passw0rd!` |
| Administrator | Employee ID `ADM20260001` | `Passw0rd!` |
| VAO / RI / Tahsildar | `VAO20260001` / `RI20260001` / `TAH20260001` | `Passw0rd!` |
| Department Officer | `DPT20260001` | `Passw0rd!` |
| Field Officer | `FLD20260001` | `Passw0rd!` |
| Grievance Officer | `GRO20260001` | `Passw0rd!` |

Officer login is two steps (Employee ID + password → OTP). The OTP isn't
emailed/texted for real — it's printed to the **backend's console log**
(`OtpService`), so watch the terminal running `mvn spring-boot:run`.

## Structure

```
src/
├── api/            axios client + one function per backend endpoint
├── auth/            AuthContext (JWT storage, current user, role helpers)
├── components/      Navbar, Footer, Timeline, StatusPill, Modal, Toast, route guards
├── pages/
│   ├── (public)      Home, Services, Track, Faq, Login, Register
│   ├── citizen/      Dashboard, Apply, MyApplications, ApplicationDetail,
│   │                 CertificateView, GrievanceForm, MyComplaints, ComplaintDetail
│   ├── officer/      VerificationQueue (VAO/RI/Tahsildar), FieldOfficerDashboard,
│   │                 DepartmentOfficerDashboard, GrievanceOfficerDashboard
│   └── admin/        AdminOverview, ManageOfficers, ManageCatalog, Analytics
└── styles/index.css  design tokens + component classes
```

## What's real vs. simplified

- **Real**: every list, form submit, approve/reject, timeline, and the
  officer-creation flow round-trips through the actual backend. The
  certificate QR code shown is the actual PNG generated server-side by
  ZXing, not a placeholder.
- **Simplified for demo purposes**: uploaded images are sent as base64 data
  URLs stored directly in the backend's TEXT columns (`ApplicationDocument.fileUrl`,
  `Grievance.photoUrl`, visit/resolution photos) rather than going through a
  real multipart upload to object storage (S3, etc.) - fine for a project's
  worth of images, but swap in a real file-upload endpoint before this holds
  many large files.
- **AI processing animation**: the step-by-step "Analyzing…" sequence on the
  grievance form is a UI animation timed to roughly match how long the real
  `POST /api/grievances` call takes — the actual category/department/
  priority/duplicate results shown afterward are the real values the backend
  computed, not scripted.

## Changelog (this revision)

- **Real image uploads everywhere a document/photo is required** - Aadhaar
  card, address proof, geo-tagged grievance photos, field-officer visit
  photos - via `<input type="file">` read into a base64 data URL
  (`src/utils/files.js`), previewed inline, and actually sent to/stored by
  the backend (no more placeholder file paths).
- **Mandatory-document enforcement in the UI**: the Apply and Resubmit flows
  won't let you submit until every required document has a file attached,
  with a specific error under whichever one is missing.
- **Declaration checkbox** ("I hereby declare...") required before an
  application can be submitted or resubmitted.
- **Browser geolocation** is requested when capturing a grievance photo or a
  field-officer visit photo (`getCurrentPosition` in `utils/files.js`),
  falling back gracefully if denied/unavailable.
- **VAO/RI/Tahsildar queue now shows the actual uploaded document images**
  (fetched from `/api/applications/{id}/documents`), not a placeholder "View"
  button.
- **Department Officer "Cross-verify" step**: before approving/closing a
  resolved grievance, the officer sees the field officer's actual geo-tagged
  resolution photo and remarks pulled from the timeline.
- **Timeline component now renders photo evidence as a clickable thumbnail**
  instead of dumping a raw (potentially huge base64) URL as text.
- **New Profile page** (`/citizen/profile`): view and edit name, email,
  address, district, ward, and language preference; saves via
  `PUT /api/citizens/me` and immediately reflects in the navbar. Reachable
  from the citizen sidebar or by clicking your name in the top-right chip.

## Known dependency on the backend fix

This frontend expects `spring.jpa.open-in-view: true` in the backend's
`application.yml` (the delivered backend now has this) — several endpoints
return JPA entities directly with lazy associations (e.g. an application's
`citizen`/`service`), and those need the Hibernate session open through
response serialization to avoid `LazyInitializationException`.
