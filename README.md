# Stocklume

**Current version:** v1.1.0

Stocklume is a full-stack stock research and virtual trading platform that lets users analyze stocks, manage a watchlist, practice trades with virtual money, and track portfolio performance.

## Main Features

- User registration and login with JWT authentication
- Protected frontend routes and protected backend API endpoints
- Stock dashboard with ticker search, watchlist add/remove, summaries, charts, market news, and analysis
- Company details modal with profile, metrics, financial statements, and charts
- Compare page for two stocks with normalized charting and relative statistics
- Light/dark mode
- Virtual trading simulation with a `$100,000` starting balance
- Buy stocks with virtual cash, sell holdings, and reset the simulation account
- Backend-owned execution price lookup for safer simulation trades
- Portfolio dashboard with cash, holdings value, total equity, P/L, holdings, and trade history
- Recent trades sorting/filtering
- Profile account dashboard with account, simulation, watchlist, and recent activity summary
- Home simulation snapshot
- Route-level lazy loading/code splitting
- Backend MySQL caching for normal market-data requests
- Application-level rate limiting
- Centralized authenticated API request handling

## v1.1.0 Highlights

- Added virtual trading simulation with `$100,000` starting balance
- Added simulation buy/sell/reset flow
- Added portfolio dashboard with holdings, cash, equity, P/L, and trade history
- Added backend-side execution price lookup for safer simulation trades
- Added Profile dashboard with account, simulation, watchlist, and recent activity summary
- Added Simulation Snapshot on Home
- Added Recent Trades sorting/filtering
- Added route-level lazy loading to improve bundle size
- Added backend market-data caching and backend-only provider credentials
- Added application-level rate limiting
- Refactored backend into routes, schemas, services, and utils
- Refactored Portfolio into components, hooks, and utilities
- Improved expired-session handling

## Tech Stack

Frontend:
- React
- Vite
- React Router
- Recharts
- Plain CSS with shared theme variables

Backend:
- FastAPI
- MySQL
- mysql-connector-python
- Pydantic
- JWT / PyJWT
- pwdlib[argon2]

Market data providers:
- Finnhub
- Yahoo Finance fallback
- Twelve Data
- Financial Modeling Prep
- Alpha Vantage

## Project Structure

```text
backend/
  main.py
  database.py
  security.py
  routes/
  schemas/
  services/
  migrations/
  tests/
  utils/
  schema.sql
  requirements.txt

frontend/src/
  Home/
  Portfolio/
  Profile/
  components/
  hooks/
  routes/
  services/
  styles/
```

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Configure MySQL and apply `backend/schema.sql` before starting the backend.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend expects the backend API to be running for login, watchlist, profile, portfolio, and simulation features.

## Deployment

Stocklume is designed for three separately managed components:

```text
Browser
  -> React/Vite static frontend
  -> FastAPI backend
  -> Managed MySQL

FastAPI
  -> rate limiter
  -> MySQL api_cache for normal market data
  -> Finnhub / Yahoo / Twelve Data / FMP / Alpha Vantage
```

Simulation execution prices bypass `api_cache` and are validated live by the
backend before a locked MySQL transaction is committed.

### Production database

For a fresh managed MySQL database:

1. Create an empty MySQL 8-compatible database and restricted application user.
2. Connect using the provider's secure client or SQL console.
3. Apply `backend/schema.sql` once. It is the canonical complete schema and
   creates `users`, `watchlist`, all Simulation tables, and `api_cache` in
   foreign-key-safe order.
4. Do not also apply `backend/migrations/001_align_production_schema.sql` to a
   fresh database.

For an existing development database:

1. Back up the database.
2. Inspect its columns, indexes, and constraints against `backend/schema.sql`.
3. Apply `backend/migrations/001_align_production_schema.sql` only when its
   legacy-to-current changes are needed.
4. The migration does not create `api_cache`; create that table from the
   canonical schema if the existing database does not already contain it.

Migrations are intentionally manual. The application does not alter production
schema during startup.

Managed providers commonly require TLS. `mysql-connector-python` negotiates TLS
when the server requires it. If the selected provider supplies a custom CA file,
mount it in the backend service and set `DB_SSL_CA` to its absolute path.
Stocklume then enables certificate and hostname verification. Never disable
certificate verification. Provider-specific certificate paths are not hardcoded.

### Production backend

Build command, with the service root set to `backend`:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Local development remains:

```bash
cd backend
uvicorn main:app --reload
```

Required backend variables:

- `DB_HOST`
- `DB_PORT` (optional; defaults to `3306`)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL_CA` (optional trusted CA path; enables certificate/hostname checks)
- `JWT_SECRET_KEY` (required, secret, at least 32 strong characters)
- `JWT_TOKEN_EXPIRY_MINUTES`
- `CORS_ALLOWED_ORIGINS` (comma-separated exact frontend origins)

Backend-only market provider variables:

- `FINNHUB_API_KEY` — required for full quote/search/profile/news functionality;
  Simulation can fall back to live Yahoo pricing if it is absent.
- `TWELVEDATA_API_KEY` — optional with Yahoo chart fallback.
- `FMP_API_KEY` — optional, needed for FMP financial details.
- `ALPHA_VANTAGE_API_KEY` — optional, needed for Alpha Vantage financial details.

Set production CORS to the exact HTTPS frontend origin or origins. Wildcard
origins are rejected. Do not include URL paths in CORS origins.

`GET /health` is the lightweight process health check. It returns only
`{"status":"ok"}` and deliberately does not contact MySQL or a paid provider.

FastAPI `/docs`, `/redoc`, and `/openapi.json` remain enabled. They expose the
public API contract, not environment values or credentials. This is reasonable
for the current project; a future production policy can disable them at app
creation if required.

### Reverse proxies and anonymous rate limits

Anonymous limits use FastAPI's `request.client.host`. The application does not
read `X-Forwarded-For` directly because clients can spoof that header.

Without trusted proxy-header configuration, FastAPI may see the proxy address
for every visitor, causing them to share one anonymous allowance. Configure the
hosting platform or Uvicorn to accept proxy headers only from the known proxy
address range. Never configure forwarded-header trust for every internet source
unless the backend itself is unreachable except through a trusted proxy.

Application limits are in memory per backend process. Hosting-level controls
such as a trusted CDN, API gateway, or reverse-proxy rate limit should provide
coarse global protection.

### Production frontend

Build command, with the service root set to `frontend`:

```bash
npm ci
npm run build
```

Publish directory:

```text
frontend/dist
```

Set the public build-time variable:

```env
VITE_API_BASE_URL=https://your-backend.example
```

This is the only frontend environment variable. Provider credentials stay in
FastAPI and must never use a `VITE_` prefix.

The static host must use an SPA fallback:

```text
all unknown frontend routes -> /index.html
```

Without this rewrite, direct visits to `/dashboard`, `/compare`, `/portfolio`,
`/profile`, `/login`, or `/register` may return the host's 404 page.

### Deployment checklist

- [ ] Managed MySQL database created
- [ ] Restricted database user configured
- [ ] Fresh schema applied, or existing database migration reviewed and applied
- [ ] Managed database TLS requirements configured and tested
- [ ] Backend environment variables configured
- [ ] Strong production JWT secret configured
- [ ] Provider keys configured as backend secrets
- [ ] Exact HTTPS frontend origin configured in CORS
- [ ] Backend deployed with dynamic `$PORT`
- [ ] `GET /health` returns HTTP 200
- [ ] Frontend built with the production `VITE_API_BASE_URL`
- [ ] Static-host SPA fallback configured
- [ ] Register, login, logout, and expired-session behavior tested
- [ ] Dashboard, Compare, Watchlist, and company details tested
- [ ] Simulation BUY, SELL, partial/full sell, reset, and failure cases tested
- [ ] Cache hits/misses and rate-limit 429 behavior tested
- [ ] Light/dark mode and mobile layout tested

## Useful Commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend syntax check:

```bash
cd backend
python -m compileall -q .
python -m unittest discover -s tests -v
pip check
```

Optional release tag:

```bash
git tag v1.1.0
```

## Security Notes

- `.env` files should never be committed.
- JWT protects private routes and backend API endpoints.
- The backend owns simulation trade execution price lookup so users cannot submit manipulated browser prices.
- Provider API keys are backend-only and are never included in the Vite build.
- Normal market data is cached; Simulation execution prices deliberately bypass that cache.
- Application rate limits supplement, but do not replace, infrastructure-level protection.

## Current Limitations / Future Improvements

- Add portfolio charts
- Add password/profile edit support later

For frontend-specific setup and route notes, see `frontend/README.md`.
