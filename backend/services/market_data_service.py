import json
import logging
import os
import ssl
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

import certifi
from fastapi import HTTPException

from services.api_cache_service import get_or_fetch_cached


logger = logging.getLogger(__name__)
REQUEST_TIMEOUT_SECONDS = 10
SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def fetch_provider_json(provider, url):
    request = Request(url, headers={"User-Agent": "Stocklume/1.0"})

    try:
        with urlopen(
            request,
            timeout=REQUEST_TIMEOUT_SECONDS,
            context=SSL_CONTEXT
        ) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        logger.warning(
            "Market data provider HTTP error: provider=%s status=%s",
            provider,
            error.code
        )
        raise HTTPException(
            status_code=502,
            detail="Market data provider request failed"
        )
    except (URLError, TimeoutError, OSError):
        logger.warning(
            "Market data provider network error: provider=%s",
            provider
        )
        raise HTTPException(
            status_code=503,
            detail="Market data provider is temporarily unavailable"
        )
    except (ValueError, json.JSONDecodeError):
        logger.warning(
            "Market data provider returned invalid JSON: provider=%s",
            provider
        )
        raise HTTPException(
            status_code=502,
            detail="Market data provider returned an invalid response"
        )


def require_provider_key(variable_name):
    api_key = os.environ.get(variable_name)

    if not api_key:
        logger.error("Market data provider is not configured: %s", variable_name)
        raise HTTPException(
            status_code=503,
            detail="Requested market data service is not configured"
        )

    return api_key


def fetch_finnhub(resource, params):
    allowed_resources = {
        "quote": "quote",
        "profile": "stock/profile2",
        "search": "search",
        "metric": "stock/metric",
        "company-news": "company-news",
        "general-news": "news"
    }
    endpoint = allowed_resources.get(resource)

    if endpoint is None:
        raise HTTPException(status_code=404, detail="Market data resource not found")

    cache_key, data_type, symbol = build_finnhub_cache_identity(
        resource,
        params
    )

    def fetch_from_provider():
        query = dict(params)
        query["token"] = require_provider_key("FINNHUB_API_KEY")
        url = f"https://finnhub.io/api/v1/{endpoint}?{urlencode(query)}"
        return fetch_provider_json("finnhub", url)

    return get_or_fetch_cached(
        cache_key,
        data_type,
        symbol,
        fetch_from_provider
    )


def fetch_yahoo_chart(symbol, range_value, interval):
    cache_key = f"chart:yahoo:{symbol}:{range_value}:{interval}"

    def fetch_from_provider():
        encoded_symbol = quote(symbol, safe="")
        query = urlencode({"range": range_value, "interval": interval})
        url = (
            "https://query1.finance.yahoo.com/v8/finance/chart/"
            f"{encoded_symbol}?{query}"
        )
        return fetch_provider_json("yahoo", url)

    return get_or_fetch_cached(
        cache_key,
        "historical_chart",
        symbol,
        fetch_from_provider
    )


def fetch_twelve_data(symbol, output_size):
    cache_key = f"chart:twelve-data:{symbol}:1day:{output_size}"

    def fetch_from_provider():
        query = urlencode({
            "symbol": symbol,
            "interval": "1day",
            "outputsize": output_size,
            "apikey": require_provider_key("TWELVEDATA_API_KEY")
        })
        return fetch_provider_json(
            "twelve-data",
            f"https://api.twelvedata.com/time_series?{query}"
        )

    return get_or_fetch_cached(
        cache_key,
        "historical_chart",
        symbol,
        fetch_from_provider
    )


def fetch_fmp(resource, symbol, limit=None, period=None):
    if resource not in {"profile", "key-metrics", "income-statement"}:
        raise HTTPException(status_code=404, detail="Market data resource not found")

    cache_key = (
        f"financials:fmp:{resource}:{symbol}:"
        f"{period or 'default'}:{limit or 'default'}"
    )

    def fetch_from_provider():
        params = {
            "symbol": symbol,
            "apikey": require_provider_key("FMP_API_KEY")
        }

        if limit is not None:
            params["limit"] = limit

        if period is not None:
            params["period"] = period

        return fetch_provider_json(
            "financial-modeling-prep",
            f"https://financialmodelingprep.com/stable/{resource}?{urlencode(params)}"
        )

    return get_or_fetch_cached(
        cache_key,
        "financial_details",
        symbol,
        fetch_from_provider
    )


def fetch_alpha_vantage_income_statement(symbol):
    cache_key = f"financials:alpha-vantage:income-statement:{symbol}"

    def fetch_from_provider():
        query = urlencode({
            "function": "INCOME_STATEMENT",
            "symbol": symbol,
            "apikey": require_provider_key("ALPHA_VANTAGE_API_KEY")
        })
        return fetch_provider_json(
            "alpha-vantage",
            f"https://www.alphavantage.co/query?{query}"
        )

    return get_or_fetch_cached(
        cache_key,
        "financial_details",
        symbol,
        fetch_from_provider
    )


def build_finnhub_cache_identity(resource, params):
    symbol = params.get("symbol")

    if resource == "quote":
        return f"quote:{symbol}", "quote", symbol

    if resource == "profile":
        return f"profile:{symbol}", "profile", symbol

    if resource == "search":
        normalized_query = " ".join(params["q"].strip().upper().split())
        return f"search:{normalized_query}", "search", None

    if resource == "metric":
        return f"metrics:{symbol}", "metrics", symbol

    if resource == "company-news":
        return (
            f"news:{symbol}:{params['from']}:{params['to']}",
            "company_news",
            symbol
        )

    if resource == "general-news":
        return "general_news", "general_news", None

    raise HTTPException(status_code=404, detail="Market data resource not found")
