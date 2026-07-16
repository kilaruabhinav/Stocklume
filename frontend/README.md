# Stocklume Frontend

**Current version:** v1.1.0

This is the React/Vite frontend for Stocklume. It provides the stock dashboard, watchlist, company details, compare workflow, profile dashboard, virtual trading portfolio, and home market overview.

## Frontend Features

- React Router routes for Home, Dashboard, Compare, Portfolio, Profile, Login, and Register
- JWT-aware protected routes
- Header navigation with light/dark theme support
- Dashboard ticker search, watchlist management, charts, news, analysis, and company details
- Company details modal with cached profile and financial-details API calls
- Compare page with two-symbol search and normalized comparison charts
- Simulation buy modal, sell modal, reset modal, and portfolio views
- Portfolio account overview, holdings, live value/P&L, performance breakdown, and recent trades sorting/filtering
- Profile dashboard with user, simulation, watchlist, and activity summaries
- Home Simulation Snapshot and market dashboard
- Route-level lazy loading with a shared page loader
- Centralized authenticated backend request handling

## Tech Stack

- React
- Vite
- React Router
- Recharts
- ESLint
- Plain CSS using shared variables from `src/styles/theme.css`

## Project Structure

```text
frontend/
  src/
    App.jsx
    Home/
    Login/
    Register/
    Portfolio/
      components/
      hooks/
      utils/
    Profile/
      components/
      hooks/
    components/
      CompanyDetailsModal/
      Compare/
      Dashboard/
      HeaderPanel/
      ProtectedRoute/
      SimulationBuyModal/
      SimulationSellModal/
      SimulationResetModal/
      Toast/
    hooks/
    routes/
    services/
      Auth/
      CompanyProfile/
      FinancialDetails/
      GetChart/
      GetNews/
      GetSearch/
      GetStats/
      GetYahoo/
      Simulation/
      Watchlist/
      cache/
    styles/
```

## Routes

```text
/           Home market overview and simulation snapshot
/dashboard  Protected stock dashboard and watchlist
/compare    Protected two-stock comparison page
/portfolio  Protected virtual trading portfolio
/profile    Protected account/profile dashboard
/login      Public login page
/register   Public registration page
```

Protected routes require a valid `access_token` in `localStorage`. If the backend returns `401` or `403`, the centralized authenticated request helper clears auth state and redirects the user back to login.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The backend must be running for login, profile, watchlist, portfolio, and simulation features.

## Environment Variables

Frontend `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_TWELVEDATA_API_KEY=your_twelvedata_api_key
VITE_FMP_API_KEY=your_fmp_api_key
VITE_VINTAGEALPHA_API_KEY=your_alpha_vantage_api_key
```

Notes:
- `VITE_API_BASE_URL` points to the FastAPI backend.
- `VITE_FINNHUB_API_KEY` powers ticker search, quotes, news, metrics, and company profile calls.
- `VITE_TWELVEDATA_API_KEY` powers chart time series.
- `VITE_FMP_API_KEY` and `VITE_VINTAGEALPHA_API_KEY` power company financial details.
- Frontend `VITE_*` variables are exposed in browser builds; do not treat them as secrets.

## Scripts

```bash
npm run dev      # Start the Vite dev server
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run preview  # Preview the production build
```

## Data and API Notes

- Backend calls should use `buildApiUrl(path)` from `src/services/apiConfig.js`.
- Protected backend calls go through `src/services/authenticatedRequest.js`.
- Auth state uses `localStorage` keys `access_token` and `stockpulse_user`.
- The simulation buy/sell API sends symbol and quantity only; the backend confirms the final execution price.
- Company profile and financial details are cached in `src/services/cache/apiCache.js` to reduce repeated quota-heavy modal calls.
- Chart and news data use client-side caching where available.
- Yahoo Finance chart/quote fallback requests are routed through the Vite proxy at `/api/yahoo-chart`.

## Manual Verification

Before shipping frontend changes:

```bash
cd frontend
npm run lint
npm run build
```

Common flows to check:
- Register/login/logout
- Dashboard ticker search and watchlist add/remove
- Stock selection, chart timeframe changes, company details modal
- Buy with virtual money from Dashboard
- Portfolio holdings, sell, reset, and recent trades sorting/filtering
- Compare two symbols
- Profile dashboard with a valid and expired token
- Light/dark mode
