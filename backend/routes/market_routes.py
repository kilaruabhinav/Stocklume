from datetime import date
import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.market_data_service import (
    fetch_alpha_vantage_income_statement,
    fetch_finnhub,
    fetch_fmp,
    fetch_twelve_data,
    fetch_yahoo_chart
)
from services.rate_limit_service import (
    enforce_client_rate_limit,
    enforce_user_rate_limit
)
from utils.db_helpers import get_authenticated_user_id


router = APIRouter(prefix="/market", tags=["market"])
security = HTTPBearer()
SYMBOL_PATTERN = re.compile(r"^[A-Z0-9.^:-]+$")


def normalize_symbol(symbol):
    normalized = symbol.strip().upper()

    if not normalized or len(normalized) > 32:
        raise HTTPException(status_code=400, detail="Symbol format is invalid")

    if not SYMBOL_PATTERN.fullmatch(normalized):
        raise HTTPException(status_code=400, detail="Symbol format is invalid")

    return normalized


def require_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    return get_authenticated_user_id(credentials)


@router.get("/finnhub/quote")
def finnhub_quote(symbol: str, _user_id: int = Depends(require_authenticated_user)):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_finnhub("quote", {"symbol": normalize_symbol(symbol)})


@router.get("/finnhub/profile")
def finnhub_profile(symbol: str, _user_id: int = Depends(require_authenticated_user)):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_finnhub("profile", {"symbol": normalize_symbol(symbol)})


@router.get("/finnhub/search")
def finnhub_search(
    q: str = Query(min_length=1, max_length=100),
    _user_id: int = Depends(require_authenticated_user)
):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_finnhub("search", {"q": q.strip()})


@router.get("/finnhub/metric")
def finnhub_metric(symbol: str, _user_id: int = Depends(require_authenticated_user)):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_finnhub(
        "metric",
        {"symbol": normalize_symbol(symbol), "metric": "all"}
    )


@router.get("/finnhub/company-news")
def finnhub_company_news(
    symbol: str,
    date_from: date,
    date_to: date,
    _user_id: int = Depends(require_authenticated_user)
):
    enforce_user_rate_limit(_user_id, "market")
    if date_from > date_to:
        raise HTTPException(status_code=400, detail="Invalid news date range")

    return fetch_finnhub("company-news", {
        "symbol": normalize_symbol(symbol),
        "from": date_from.isoformat(),
        "to": date_to.isoformat()
    })


@router.get("/finnhub/general-news")
def finnhub_general_news(request: Request):
    enforce_client_rate_limit(request, "general_news")
    return fetch_finnhub("general-news", {"category": "general"})


@router.get("/yahoo-chart/{symbol}")
def yahoo_chart(
    symbol: str,
    range_value: str = Query(alias="range", pattern=r"^(5d|1mo|3mo|6mo|1y)$"),
    interval: str = Query(default="1d", pattern=r"^1d$"),
    _user_id: int = Depends(require_authenticated_user)
):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_yahoo_chart(normalize_symbol(symbol), range_value, interval)


@router.get("/twelve-data/time-series")
def twelve_data_time_series(
    symbol: str,
    outputsize: int = Query(ge=1, le=5000),
    _user_id: int = Depends(require_authenticated_user)
):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_twelve_data(normalize_symbol(symbol), outputsize)


@router.get("/fmp/{resource}")
def fmp_data(
    resource: str,
    symbol: str,
    limit: int | None = Query(default=None, ge=1, le=20),
    period: str | None = Query(default=None, pattern=r"^(annual|quarter)$"),
    _user_id: int = Depends(require_authenticated_user)
):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_fmp(
        resource,
        normalize_symbol(symbol),
        limit=limit,
        period=period
    )


@router.get("/alpha-vantage/income-statement")
def alpha_vantage_income_statement(
    symbol: str,
    _user_id: int = Depends(require_authenticated_user)
):
    enforce_user_rate_limit(_user_id, "market")
    return fetch_alpha_vantage_income_statement(normalize_symbol(symbol))
