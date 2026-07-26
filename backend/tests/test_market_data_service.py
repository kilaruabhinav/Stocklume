import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services import market_data_service


class MarketDataServiceTests(unittest.TestCase):
    @patch.dict("os.environ", {}, clear=True)
    def test_missing_provider_key_is_reported_without_a_secret_fallback(self):
        with self.assertRaises(HTTPException) as context:
            market_data_service.require_provider_key("FINNHUB_API_KEY")

        self.assertEqual(context.exception.status_code, 503)

    @patch("services.market_data_service.fetch_provider_json")
    @patch(
        "services.market_data_service.get_or_fetch_cached",
        side_effect=lambda _key, _type, _symbol, fetch_value: fetch_value()
    )
    @patch.dict("os.environ", {"FINNHUB_API_KEY": "test-secret"}, clear=True)
    def test_provider_key_is_added_only_by_backend(
        self,
        _mock_cache,
        mock_fetch
    ):
        mock_fetch.return_value = {"c": 123}

        result = market_data_service.fetch_finnhub(
            "quote",
            {"symbol": "AAPL"}
        )

        self.assertEqual(result, {"c": 123})
        called_url = mock_fetch.call_args.args[1]
        self.assertIn("token=test-secret", called_url)

    @patch("services.market_data_service.fetch_provider_json")
    @patch("services.market_data_service.get_or_fetch_cached")
    def test_repeated_quote_can_be_served_without_second_provider_call(
        self,
        mock_cache,
        mock_provider
    ):
        stored_values = {}

        def cache_side_effect(key, _type, _symbol, fetch_value):
            if key not in stored_values:
                stored_values[key] = fetch_value()
            return stored_values[key]

        mock_cache.side_effect = cache_side_effect
        mock_provider.return_value = {"c": 123.45}

        with patch.dict(
            "os.environ",
            {"FINNHUB_API_KEY": "test-secret"},
            clear=True
        ):
            first = market_data_service.fetch_finnhub(
                "quote",
                {"symbol": "AAPL"}
            )
            second = market_data_service.fetch_finnhub(
                "quote",
                {"symbol": "AAPL"}
            )

        self.assertEqual(first, second)
        mock_provider.assert_called_once()

    def test_simulation_price_service_does_not_import_api_cache(self):
        from services import market_price_service

        self.assertFalse(hasattr(market_price_service, "get_cached_value"))
        self.assertFalse(hasattr(market_price_service, "get_or_fetch_cached"))


if __name__ == "__main__":
    unittest.main()
