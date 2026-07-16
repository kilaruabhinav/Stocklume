# Stocklume

Stocklume is a full-stack stock analysis workspace with a React/Vite frontend and a FastAPI + MySQL backend. It includes account auth, saved watchlists, market data, charts, company details, comparison tools, news, and a dark-mode-capable UI.

## Repository Structure

```text
stock_analysis/
  backend/
    main.py              FastAPI routes for auth, profile, and watchlist APIs
    database.py          Environment loading and MySQL connection helper
    security.py          Password hashing and JWT helpers
    requirements.txt     Backend Python dependencies
    schema.sql           Canonical MySQL schema for local setup
    .env.example         Backend environment template
  frontend/
    src/                 React application source
    public/              Static frontend assets
    package.json         Frontend scripts and dependencies
    .env.example         Frontend environment template
    README.md            Detailed frontend route/component documentation
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- MySQL 8+ or compatible
- API keys for the market-data providers used by the frontend

## Environment Setup

Copy the example files and fill in local values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Real `.env` files are intentionally ignored by Git. Keep production secrets in your deployment environment, not in the repository.

## Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend expects MySQL tables for `users` and `watchlist`. Use `backend/schema.sql` as the canonical local setup schema. See `frontend/README.md` for route details.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
cd frontend
npm run build
```

Lint:

```bash
cd frontend
npm run lint
```

## GitHub Push Checklist

- Do not commit `backend/.env` or `frontend/.env`.
- Do not commit generated folders such as `frontend/dist`, `frontend/node_modules`, `backend/venv`, or Python cache folders.
- Run `npm run lint` and `npm run build` from `frontend/` before pushing frontend changes.
- Confirm backend environment variables exist in the target deployment environment.

More detailed feature, route, and component documentation lives in `frontend/README.md`.
