import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from fastapi import HTTPException

from main import app
from security import create_access_token
from services.rate_limit_service import rate_limiter


class FakeCursor:
    def __init__(self, result=None):
        self.result = result

    def execute(self, _query, _params):
        pass

    def fetchone(self):
        return self.result

    def close(self):
        pass


class FakeConnection:
    def __init__(self, cursor_result=None):
        self.cursor_result = cursor_result

    def cursor(self, dictionary=False):
        return FakeCursor(self.cursor_result)

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


class RateLimitingTests(unittest.TestCase):
    def setUp(self):
        rate_limiter.reset()
        self.client = TestClient(app)

    def test_login_sixth_request_is_limited_with_retry_after(self):
        with patch(
            "routes.auth_routes.get_db_connection",
            return_value=FakeConnection()
        ):
            responses = [
                self.client.post(
                    "/login",
                    json={
                        "email": "person@example.com",
                        "password": "not-the-password"
                    }
                )
                for _ in range(6)
            ]

        self.assertTrue(all(response.status_code == 401 for response in responses[:5]))
        self.assertEqual(responses[5].status_code, 429)
        self.assertEqual(responses[5].headers.get("retry-after"), "60")
        self.assertEqual(
            responses[5].json(),
            {"detail": "Too many requests. Please try again shortly."}
        )

    @patch("routes.simulation_routes.buy_stock", return_value=Decimal("10.00"))
    @patch("routes.simulation_routes.get_current_price", return_value=Decimal("10.0000"))
    @patch(
        "routes.simulation_routes.get_db_connection",
        return_value=FakeConnection()
    )
    def test_blocked_buy_stops_before_price_and_users_are_isolated(
        self,
        _mock_connection,
        mock_price,
        mock_buy
    ):
        user_a_headers = {
            "Authorization": f"Bearer {create_access_token(101)}"
        }
        user_b_headers = {
            "Authorization": f"Bearer {create_access_token(202)}"
        }

        user_a_responses = [
            self.client.post(
                "/simulation/buy",
                json={"symbol": "AAPL", "quantity": 1},
                headers=user_a_headers
            )
            for _ in range(11)
        ]
        user_b_response = self.client.post(
            "/simulation/buy",
            json={"symbol": "AAPL", "quantity": 1},
            headers=user_b_headers
        )

        self.assertTrue(
            all(response.status_code == 200 for response in user_a_responses[:10])
        )
        self.assertEqual(user_a_responses[10].status_code, 429)
        self.assertEqual(
            user_a_responses[10].headers.get("retry-after"),
            "60"
        )
        self.assertEqual(user_b_response.status_code, 200)
        self.assertEqual(mock_price.call_count, 11)
        self.assertEqual(mock_buy.call_count, 11)

    @patch("routes.market_routes.fetch_finnhub", return_value={"c": 123.45})
    def test_market_limit_counts_responses_even_when_data_is_cached(
        self,
        mock_fetch
    ):
        headers = {
            "Authorization": f"Bearer {create_access_token(303)}"
        }

        responses = [
            self.client.get(
                "/market/finnhub/quote",
                params={"symbol": "AAPL"},
                headers=headers
            )
            for _ in range(61)
        ]

        self.assertTrue(all(response.status_code == 200 for response in responses[:60]))
        self.assertEqual(responses[60].status_code, 429)
        self.assertEqual(mock_fetch.call_count, 60)

    def test_anonymous_client_identities_have_separate_limits(self):
        for _ in range(20):
            rate_limiter.check("general_news", "client:192.0.2.10")

        with self.assertRaises(HTTPException) as context:
            rate_limiter.check("general_news", "client:192.0.2.10")

        rate_limiter.check("general_news", "client:192.0.2.11")
        self.assertEqual(context.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
