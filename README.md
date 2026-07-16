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
- API caching for company profile and financial details
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
- Added API caching for company profile and financial details
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

Market data APIs:
- Finnhub
- Yahoo Finance fallback/proxy
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

Configure MySQL before starting the backend. The app expects a database with the required auth, watchlist, and simulation tables.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend expects the backend API to be running for login, watchlist, profile, portfolio, and simulation features.

## Environment Variables

Backend `backend/.env`:

```env
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET_KEY=replace_with_a_long_random_secret
JWT_TOKEN_EXPIRY_MINUTES=30
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FINNHUB_API_KEY=your_finnhub_api_key
```

Frontend `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_TWELVEDATA_API_KEY=your_twelvedata_api_key
VITE_FMP_API_KEY=your_fmp_api_key
VITE_VINTAGEALPHA_API_KEY=your_alpha_vantage_api_key
```

Do not commit real `.env` files or API keys. Frontend `VITE_*` keys are public in browser builds.

## Database Notes

Required tables:
- `users`
- `watchlist`
- `simulation_accounts`
- `simulation_holdings`
- `simulation_trades`

`backend/schema.sql` contains the base local schema for `users` and `watchlist`. If setting up a fresh database for v1.1.0, also make sure the simulation tables exist with the columns used by `backend/services/simulation_service.py`.

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
python3 -m py_compile main.py database.py security.py routes/*.py schemas/*.py services/*.py utils/*.py
```

Optional release tag:

```bash
git tag v1.1.0
```

## Security Notes

- `.env` files should never be committed.
- JWT protects private routes and backend API endpoints.
- The backend owns simulation trade execution price lookup so users cannot submit manipulated browser prices.
- Frontend market-data API keys are visible to users because Vite embeds `VITE_*` variables in the client bundle.

## Current Limitations / Future Improvements

- Move more market-data calls backend-side
- Add deployment configuration
- Add automated tests
- Improve chart and market-data caching
- Add portfolio charts
- Add password/profile edit support later

For frontend-specific setup and route notes, see `frontend/README.md`.
