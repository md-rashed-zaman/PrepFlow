# Phase 08: Frontend MVP (1-3 days)

Goal: ship a usable web UI for the existing backend endpoints without weakening auth security.

## Key decisions

- **Next.js App Router** under `apps/web`.
- **BFF pattern** (recommended):
  - Browser talks to Next.js only.
  - Next.js stores access/refresh tokens in **httpOnly cookies**.
  - Next.js route handlers proxy to the Go API.

Why: avoids `localStorage` token storage and reduces XSS blast radius.

## Deliverables

### 1) App skeleton and navigation
- Route groups:
  - `(auth)`: `/login`, `/register`
  - `(app)`: `/today`, `/library`, `/settings`
- Shared shell layout with navigation and logout.

### 2) Auth flows (BFF)
- `POST /api/auth/register` sets httpOnly cookies.
- `POST /api/auth/login` sets httpOnly cookies.
- `POST /api/auth/logout` clears cookies (best-effort revocation in API).
- `GET /api/auth/me` proxies to API.
- Automatic refresh on 401 inside BFF proxy logic.

### 3) Core pages

**Today**
- Fetch due items (`GET /api/reviews/due?window_days=...`).
- Quick-grade buttons 0–4 (`POST /api/reviews`).

**Library**
- List problems (`GET /api/problems`).
- Add problem dialog (`POST /api/problems`).
- Archive/activate (`PATCH /api/problems/:id`).

**Settings**
- Load profile (`GET /api/auth/me`).
- Update `timezone`, `min_interval_days`, `due_hour_local`, `due_minute_local`.
- Google Calendar (ICS):
  - Generate subscription link via `POST /api/calendar/ics/rotate`.
  - Show a URL the user can paste into Google Calendar.

### 4) Docker
- `apps/web/Dockerfile` builds Next.js in `standalone` mode.
- `deploy/compose/docker-compose.yml` runs `web` alongside `api` and `postgres`.

## Testing (MVP)
- `npm -C apps/web run lint`
- `npm -C apps/web run build`
- Full stack smoke (Docker):
  - Register/login via web BFF routes
  - Create problem
  - Post a review and see due date move
  - Generate ICS link and fetch `GET /ics?token=...`

## Exit criteria
- A user can register, add problems, review due items, and generate a Google Calendar subscription link end-to-end.

