import json
import logging
import os
import ssl
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

import certifi
from fastapi import HTTPException


logger = logging.getLogger(__name__)
PRICE_LOOKUP_ERROR = "Could not fetch current price. Please try again."
REQUEST_TIMEOUT_SECONDS = 8
SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
PRICE_QUANTUM = Decimal("0.0001")


def get_current_price(symbol: str) -> Decimal:
    normalized_symbol = symbol.strip().upper()

    if not normalized_symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")

    price = fetch_finnhub_price(normalized_symbol)

    if price is None:
        price = fetch_yahoo_price(normalized_symbol)

    if price is None:
        raise HTTPException(status_code=400, detail=PRICE_LOOKUP_ERROR)

    return price.quantize(PRICE_QUANTUM, rounding=ROUND_HALF_UP)


def fetch_finnhub_price(symbol: str):
    api_key = os.environ.get("FINNHUB_API_KEY")

    if not api_key:
        return None

    for candidate in get_finnhub_symbol_candidates(symbol):
        url = "https://finnhub.io/api/v1/quote?" + urlencode(
            {
                "symbol": candidate,
                "token": api_key
            }
        )
        data = fetch_json(url, provider="finnhub", symbol=candidate)
        price = parse_price(data.get("c") if isinstance(data, dict) else None)

        if price is not None:
            return price

        logger.warning(
            "Simulation price lookup returned no usable price: "
            "symbol=%s provider=finnhub",
            candidate
        )

    return None


def fetch_yahoo_price(symbol: str):
    yahoo_symbol = normalize_yahoo_symbol(symbol)
    encoded_symbol = quote(yahoo_symbol, safe="")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded_symbol}"
        "?range=5d&interval=1d"
    )
    data = fetch_json(url, provider="yahoo", symbol=yahoo_symbol)
    result = data.get("chart", {}).get("result", []) if isinstance(data, dict) else []

    if not result:
        logger.warning(
            "Simulation price lookup returned no result: symbol=%s provider=yahoo",
            yahoo_symbol
        )
        return None

    meta = result[0].get("meta", {})
    price = parse_price(meta.get("regularMarketPrice"))

    if price is None:
        logger.warning(
            "Simulation price lookup returned no usable price: "
            "symbol=%s provider=yahoo",
            yahoo_symbol
        )

    return price


def fetch_json(url: str, provider: str, symbol: str):
    request = Request(
        url,
        headers={
            "User-Agent": "Stocklume/1.0"
        }
    )

    try:
        with urlopen(
            request,
            timeout=REQUEST_TIMEOUT_SECONDS,
            context=SSL_CONTEXT
        ) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        logger.warning(
            "Simulation price lookup HTTP error: symbol=%s provider=%s status=%s",
            symbol,
            provider,
            error.code
        )
        return None
    except (URLError, TimeoutError, OSError) as error:
        logger.warning(
            "Simulation price lookup network error: "
            "symbol=%s provider=%s error=%s",
            symbol,
            provider,
            type(error).__name__
        )
        return None
    except (ValueError, json.JSONDecodeError) as error:
        logger.warning(
            "Simulation price lookup invalid response: "
            "symbol=%s provider=%s error=%s",
            symbol,
            provider,
            type(error).__name__
        )
        return None


def get_finnhub_symbol_candidates(symbol: str):
    candidates = [symbol]

    if symbol.endswith(".NS"):
        candidates.append(f"NSE:{symbol.replace('.NS', '')}")
    elif symbol.endswith(".BO"):
        candidates.append(f"BSE:{symbol.replace('.BO', '')}")

    return list(dict.fromkeys(candidates))


def normalize_yahoo_symbol(symbol: str):
    if symbol.startswith("NSE:"):
        return f"{symbol.replace('NSE:', '')}.NS"

    if symbol.startswith("BSE:"):
        return f"{symbol.replace('BSE:', '')}.BO"

    return symbol


def parse_price(value):
    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if price <= 0:
        return None

    return price
