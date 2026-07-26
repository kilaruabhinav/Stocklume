import json
import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services import market_price_service


class MarketPriceServiceTests(unittest.TestCase):
    @patch("services.market_price_service.urlopen")
    def test_fetch_json_uses_verified_certificate_context(self, mock_urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps({"price": 123}).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = response

        result = market_price_service.fetch_json(
            "https://example.test/quote",
            provider="test",
            symbol="AAPL"
        )

        self.assertEqual(result, {"price": 123})
        self.assertIs(
            mock_urlopen.call_args.kwargs["context"],
            market_price_service.SSL_CONTEXT
        )

    @patch("services.market_price_service.fetch_yahoo_price")
    @patch("services.market_price_service.fetch_finnhub_price")
    def test_current_price_falls_back_to_yahoo(
        self,
        mock_finnhub,
        mock_yahoo
    ):
        mock_finnhub.return_value = None
        mock_yahoo.return_value = Decimal("213.40")

        price = market_price_service.get_current_price(" aapl ")

        self.assertEqual(price, Decimal("213.40"))
        mock_finnhub.assert_called_once_with("AAPL")
        mock_yahoo.assert_called_once_with("AAPL")

    def test_non_positive_prices_are_rejected(self):
        self.assertIsNone(market_price_service.parse_price(0))
        self.assertIsNone(market_price_service.parse_price(-1))


if __name__ == "__main__":
    unittest.main()
