# Stocklume

Stocklume is a full-stack stock analysis workspace built with React, Vite, FastAPI, and MySQL. It combines a saved watchlist, live quotes, chart-based statistics, market news, company fundamentals, comparison tools, and a compact US market session status view.

## Features

- Authenticated user accounts with JWT-based login, registration, profile, and logout flows.
- MySQL-backed watchlists with add, remove, reload, and periodic quote refresh.
- Ticker search/autocomplete powered by Finnhub.
- Dashboard for selected stocks with price charts, timeframe controls, statistics, insights, news, and company details.
- Chart fallbacks through Yahoo Finance when Twelve Data or Finnhub data is stale/unavailable, including NSE/BSE symbol normalization.
- Company detail modal with profile data, valuation/profitability metrics, income statement tables, and financial bar charts.
- Compare page for two assets with normalized return charts, summary cards, relative stats, and advanced comparison insights.
- Home page with market news, market overview cards, sector/mover snapshots, watchlist preview, and US market open/close status.

## Current Version: 1.0.0

Version `1.0.0` is the first complete Stocklume application release. It includes:

- Public landing/home experience with a ticker tape, market prep hero, live/fallback market news, index cards, sector snapshots, movers, watchlist preview, and compact US market open/close status.
- Account system with registration, login, logout, stored bearer tokens, authenticated profile loading, and protected watchlist API usage.
- Persistent watchlist backed by MySQL, including duplicate prevention, deletion, initial reload, periodic quote refresh, and loading/empty states.
- Stock dashboard with selected-stock summary, timeframe controls, chart loading states, SMA overlays, statistics, technical insight cards, company news, and toast notifications.
- Company details modal with profile metadata, valuation/market snapshot rows, profitability/growth metrics, balance-sheet metrics, income statement tables, and financial bar charts.
- Compare workflow with two ticker pickers, normalized return chart, summary cards, relative metrics, and advanced comparison insight strips.
- Multi-provider market data strategy using Finnhub first where appropriate, Twelve Data for chart series, Yahoo Finance as quote/chart fallback, and FMP/Alpha Vantage for financial detail enrichment.
- Local caching for chart and news responses to reduce repeated API calls during normal usage.

## Tech Stack

Frontend:
- React 19
- Vite 8
- React Router
- Recharts
- ESLint

Backend:
- FastAPI
- MySQL Connector
- PyJWT
- pwdlib password hashing
- Pydantic
- CORS middleware

Market data providers:
- Finnhub: quotes, ticker search, stock metrics, company profile, company/news feeds
- Twelve Data: daily chart series
- Yahoo Finance chart endpoint via Vite proxy fallback
- Financial Modeling Prep: company profile/key metrics/income statements
- Alpha Vantage: income statements and TTM fallback calculations

## Project Structure

```text
stock_analysis/
  backend/
    main.py                  FastAPI routes for auth, profile, and watchlist
    database.py              Local env loading and MySQL connection helper
    security.py              Password hashing and JWT helpers
    .env.example             Backend environment template
  frontend/
    src/
      Home/                  Home page and market overview sections
      Login/                 Login page
      Register/              Registration page
      Profile/               Authenticated profile page
      components/
        Chart/               Stock chart and overlays
        Compare/             Asset comparison workflow
        CompanyDetailsModal/ Company profile and financial statements
        Insights/            Chart-derived insights
        News/                Company news cards
        Watchlist/           Watchlist list and empty/loading states
      hooks/
        DashboardHooks.jsx   Dashboard state/data orchestration
      services/              API clients for auth, market data, profile, watchlist
    vite.config.js           React plugin and Yahoo Finance proxy
    .env.example             Frontend environment template
```

## Frontend Route and Component Map

Routes are declared in `src/App.jsx` and share the top-level `HeaderPanel` navigation.

### `/` - Home

Primary component: `Home/Home.jsx`

Main components:
- `HomeTickerTape`: scrolling static market ticker strip.
- `HomeHero`: hero copy, dashboard/compare navigation, research routine cards, and compact US market open/close status widget.
- `HomeMarketDashboard`: market news feed, fallback headlines, index cards, sector performance, mover notes, watchlist snapshot, and next-check action queue.

Supporting behavior:
- Uses `VITE_FINNHUB_API_KEY` for live general market news when available.
- Falls back to curated market headlines and Unsplash images when live news is unavailable.
- Calculates US regular market open/close status in Eastern Time, skipping weekends and common market holidays.

### `/dashboard` - Stock Analysis Dashboard

Primary component: `components/Dashboard/Dashboard.jsx`

Main components:
- `LeftPanel`: watchlist/search column and selected-stock insights.
- `StockForm`: ticker entry with Finnhub autocomplete.
- `Watchlist`: saved watchlist list, loading skeletons, and empty state.
- `StockCard`: selectable stock row with quote, move, active state, and delete action.
- `AnalizePanel`: main dashboard workspace for the selected stock.
- `HBMW`: selected stock title and timeframe controls.
- `SelectedStockSummary`: compact selected-stock price/move/window summary and details button.
- `CompanyDetailsModal`: expanded company profile, financial metrics, statements, and charts.
- `ChartData`: Recharts price chart with SMA overlays and loading/error/empty states.
- `Stats`: price movement, valuation, and 52-week range statistics.
- `Insights`: chart-derived trend, range, participation, and risk cards.
- `News`: company news loader, empty state, and news card grid.
- `Toast`: transient success/error/info messages.

Supporting behavior:
- `DashboardHooks.jsx` coordinates watchlist loading, quote enrichment, selection state, chart cache, news cache, timeframe changes, and periodic quote refresh.
- Calls backend `/watchlist` and `/profile` routes with the stored bearer token.
- Calls market-data services for quote, chart, analysis, news, profile, and financial details.

### `/compare` - Asset Comparison

Primary component: `components/Compare/Compare.jsx`

Main components:
- `CompareHeader`: compare page title and timeframe controls.
- `CompareSearchSection`: two-symbol form and submit button.
- `CompareSymbolPicker`: ticker autocomplete input for each side of the comparison.
- `CompareSummaryGrid`: two summary cards for the selected assets.
- `CompareSummaryCard`: current price, return, high/low, and range summary.
- `CompareChart`: normalized return chart, empty state, legend, and tooltip.
- `CompareAdvancedStats`: relative stats, insight pills, and comparison matrix.

Supporting behavior:
- Fetches quote and chart data for both tickers.
- Re-runs the comparison when the timeframe changes after a pair has been loaded.
- Uses `compareUtils.js` to build chart series, summaries, relative stats, and insight messages.

### `/login` - Login

Primary component: `Login/Login.jsx`

Main components:
- `LoginForm`: email/password form, API submission, success/error messages, token storage, and navigation to the dashboard.

Supporting behavior:
- Sends credentials to backend `POST /login`.
- Stores `access_token` and `stockpulse_user` in `localStorage`.
- Notifies the header/profile state through the auth storage event helper.

### `/register` - Registration

Primary component: `Register/Register.jsx`

Main components:
- `RegisterForm`: name/email/password form, validation feedback, API submission, and navigation to login after success.

Supporting behavior:
- Sends account details to backend `POST /register`.
- Relies on backend validation for required fields, duplicate emails, and minimum password length.

### `/profile` - User Profile

Primary component: `Profile/Profile.jsx`

Main components:
- `ProfileOverview`: profile identity card and high-level account display.
- `ProfileSession`: authenticated session details and sign-out action.

Supporting behavior:
- Requires an authenticated user in local storage.
- Fetches backend `GET /profile`.
- Redirects to `/login` if no user/token is available or profile loading fails.

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
```

Frontend `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_TWELVEDATA_API_KEY=your_twelvedata_api_key
VITE_FMP_API_KEY=your_fmp_api_key
VITE_VINTAGEALPHA_API_KEY=your_alpha_vantage_api_key
```

Note: the code expects `VITE_VINTAGEALPHA_API_KEY` for Alpha Vantage.

## Database Setup

Create a MySQL database with `users` and `watchlist` tables compatible with the backend routes:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_symbol (user_id, symbol),
  CONSTRAINT fk_watchlist_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

## Running Locally

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn mysql-connector-python pyjwt pwdlib pydantic
cp .env.example .env
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Available Frontend Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## Backend API

```text
POST   /register   Create a user account
POST   /login      Authenticate and return a bearer token
GET    /profile    Return the authenticated user's profile
GET    /watchlist  Return saved watchlist symbols
POST   /watchlist  Add a symbol to the watchlist
DELETE /watchlist  Remove a symbol from the watchlist
```

Authenticated routes require:

```text
Authorization: Bearer <access_token>
```

## Data Flow Notes

- Auth tokens and basic user data are stored in `localStorage`.
- The dashboard loads the saved watchlist from the backend, enriches each symbol with quote data, and refreshes watchlist prices every two minutes.
- Chart data is cached in `localStorage` for six hours and checked for staleness before reuse.
- News data is cached in `localStorage` for six hours and filtered for ticker/company relevance.
- Finnhub market capitalization values are displayed as million-based values, so trillion-scale companies render correctly.
- Yahoo Finance requests are proxied through Vite at `/api/yahoo-chart` to avoid direct browser calls to the Yahoo endpoint.

## Verification

Run these before shipping frontend changes:

```bash
cd frontend
npm run lint
npm run build
```

The current build can emit Vite's chunk-size warning because the app bundle includes the dashboard, charts, compare tools, and modal flows in one client bundle.
