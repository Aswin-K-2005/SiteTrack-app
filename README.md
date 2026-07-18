 SiteTrack — Construction Attendance Tracker

Geofenced attendance tracking. Workers check in/out from a mobile browser only
when physically inside a radius around their assigned site; admins manage
sites (by pinning a location on a map) and workers, and see a live dashboard.

```
sitetrack/
├── backend/     FastAPI + SQLAlchemy + JWT auth
└── frontend/    React + Vite + Leaflet
```

## Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt

cp .env.example .env            # then edit SECRET_KEY at minimum
uvicorn app.main:app --reload --port 8000
```

First run creates `sitetrack.db` (SQLite) and seeds a default admin:
`admin` / `admin123`. **Log in and change that password immediately** —
it's meant to be replaced on first use, not left as-is.

API docs live at `http://localhost:8000/docs` (interactive Swagger UI) — useful
for poking at endpoints directly while you build.

### Swapping SQLite for Postgres later
Change `DATABASE_URL` in `.env` to a Postgres URL and `pip install psycopg2-binary`.
SQLAlchemy's models don't need to change.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env            # only needed if your API isn't on localhost:8000
npm run dev
```

Opens at `http://localhost:5173`. Make sure the backend is running first —
the frontend calls it directly (no proxy needed since CORS is configured).

## How the auth flow works

1. Admin creates a worker with a temporary password (`POST /users`).
2. Worker logs in (`POST /auth/login`) → gets a JWT, but the response also
   says `must_change_password: true`.
3. Frontend redirects them to the "set your password" screen, which calls
   `POST /auth/change-password`. After that, `must_change_password` flips to
   `false` and they can use the app normally.
4. The JWT is stored in `localStorage` on the frontend and sent as
   `Authorization: Bearer <token>` on every request. Tokens expire after 12
   hours by default (`ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`).

Passwords are hashed with bcrypt (via passlib) — never stored or logged in
plain text on the backend. The one exception is temporary passwords, which
are generated in plain text so the admin can hand them to the worker, then
immediately hashed before being saved.

## How the geofence check works

This is deliberately enforced **server-side**, in `attendance_router.py`:
the phone sends its raw `latitude`/`longitude`, and the backend — not the
browser — calculates the distance to the site's stored coordinates
(haversine formula, `app/geo.py`) and rejects the check-in if it's outside
the site's radius. Never trust a client to self-report "I'm inside the
fence" — that's trivially fakeable from devtools or a mocked GPS app.

## SQL injection

Every query goes through SQLAlchemy's ORM (`db.query(...).filter(Column ==
value)` or `db.get(Model, id)`), which parameterizes values instead of
string-interpolating them into SQL. There is no raw SQL anywhere in this
codebase — keep it that way; if you ever reach for `db.execute(text(...))`
for something custom, always pass values as bound parameters, never f-strings.

## Pinning a site location

Admin → Sites → "Add a site": tap anywhere on the map to drop a pin (or hit
"Use my location" if you're standing on the actual site), set a radius, and
save. Uses `react-leaflet` with free OpenStreetMap tiles — no API key or
billing account required, unlike Google Maps.

## What's still V0 / things to harden before real rollout

- **No refresh tokens** — a JWT is valid until it expires, full stop. Fine
  for a single 12-hour shift; for anything longer-lived, add a refresh-token
  flow or shorten the expiry and re-prompt login.
- **No rate limiting** on `/auth/login` — add something like `slowapi` before
  this is internet-facing, or brute-forcing passwords is just a matter of time.
- **No HTTPS built in** — this app sends JWTs and (temporary) passwords over
  the wire; always deploy behind HTTPS (a reverse proxy like Caddy or nginx
  with Let's Encrypt is the easy path) so tokens can't be sniffed on shared
  wifi at a job site.
- **No password complexity rules** beyond a 6-character minimum — tighten if
  your compliance needs demand it.
- **No audit log / soft delete** — deleting a site currently unassigns
  workers from it rather than blocking the delete; there's no history of who
  changed what.
- **SQLite is fine for a pilot**, but move to Postgres before real concurrent
  usage across many sites — SQLite handles concurrent writes poorly at scale.
# SiteTrack-app
