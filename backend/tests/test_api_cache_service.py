import json
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services import api_cache_service
from psycopg.types.json import Jsonb


class FakeCacheDatabase:
    def __init__(self):
        self.rows = {}

    def connect(self):
        return FakeConnection(self)


class FakeConnection:
    def __init__(self, database):
        self.database = database
        self.closed = False
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return FakeCursor(self.database)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


class FakeCursor:
    def __init__(self, database):
        self.database = database
        self.result = None
        self.rowcount = 0
        self.last_params = None

    def execute(self, query, params):
        normalized_query = " ".join(query.split())
        self.last_params = params

        if normalized_query.startswith("SELECT response_data"):
            row = self.database.rows.get(params[0])

            if row is None:
                self.result = None
            else:
                self.result = {
                    "response_data": row["response_data"],
                    "is_valid": row["expires_at"] > datetime.now()
                }
            return

        if normalized_query.startswith("INSERT INTO api_cache"):
            if "ON CONFLICT (cache_key) DO UPDATE" not in normalized_query:
                raise AssertionError("Cache writes must use PostgreSQL upserts")
            if "EXCLUDED.response_data" not in normalized_query:
                raise AssertionError("Cache upserts must use EXCLUDED values")
            if "INTERVAL '1 second'" not in normalized_query:
                raise AssertionError("Cache expiry must use PostgreSQL intervals")
            cache_key, data_type, symbol, response_data, ttl_seconds = params
            if not isinstance(response_data, Jsonb):
                raise AssertionError("Cache writes must use psycopg Jsonb")
            self.database.rows[cache_key] = {
                "data_type": data_type,
                "symbol": symbol,
                "response_data": response_data.obj,
                "expires_at": datetime.now() + timedelta(seconds=ttl_seconds)
            }
            self.rowcount = 1
            return

        if normalized_query.startswith("DELETE FROM api_cache WHERE cache_key"):
            self.rowcount = int(self.database.rows.pop(params[0], None) is not None)
            return

        if normalized_query.startswith("WITH expired_rows AS"):
            if "ORDER BY expires_at LIMIT %s" not in normalized_query:
                raise AssertionError("Cache cleanup must retain its row limit")
            now = datetime.now()
            expired_keys = [
                key
                for key, row in self.database.rows.items()
                if row["expires_at"] < now
            ][:params[0]]

            for key in expired_keys:
                del self.database.rows[key]
            return

        raise AssertionError(f"Unexpected SQL in cache test: {normalized_query}")

    def fetchone(self):
        return self.result

    def close(self):
        pass


class ApiCacheServiceTests(unittest.TestCase):
    def setUp(self):
        self.database = FakeCacheDatabase()
        self.connection_patch = patch(
            "services.api_cache_service.get_db_connection",
            side_effect=self.database.connect
        )
        self.connection_patch.start()

    def tearDown(self):
        self.connection_patch.stop()

    def test_write_then_read_returns_nested_json(self):
        value = {
            "quote": {"symbol": "AAPL", "price": 123.45},
            "points": [1, {"close": 122.1}]
        }

        wrote = api_cache_service.set_cached_value(
            "quote:AAPL",
            "quote",
            "AAPL",
            value,
            30
        )

        self.assertTrue(wrote)
        self.assertEqual(
            api_cache_service.get_cached_value("quote:AAPL"),
            value
        )

    def test_expired_entry_is_a_cache_miss(self):
        self.database.rows["quote:AAPL"] = {
            "response_data": json.dumps({"c": 123}),
            "expires_at": datetime.now() - timedelta(seconds=1)
        }

        self.assertIsNone(
            api_cache_service.get_cached_value("quote:AAPL")
        )

    def test_rewriting_same_key_refreshes_without_duplicate(self):
        api_cache_service.set_cached_value(
            "profile:AAPL",
            "profile",
            "AAPL",
            {"name": "Old"},
            60
        )
        first_expiry = self.database.rows["profile:AAPL"]["expires_at"]

        api_cache_service.set_cached_value(
            "profile:AAPL",
            "profile",
            "AAPL",
            {"name": "New"},
            3600
        )

        self.assertEqual(len(self.database.rows), 1)
        self.assertEqual(
            api_cache_service.get_cached_value("profile:AAPL"),
            {"name": "New"}
        )
        self.assertGreater(
            self.database.rows["profile:AAPL"]["expires_at"],
            first_expiry
        )

    def test_cleanup_uses_a_limited_postgresql_cte(self):
        self.database.rows["expired"] = {
            "response_data": {"old": True},
            "expires_at": datetime.now() - timedelta(seconds=1)
        }
        api_cache_service._write_count = 99

        self.assertTrue(api_cache_service.set_cached_value(
            "quote:AAPL", "quote", "AAPL", {"price": 123}, 30
        ))
        self.assertNotIn("expired", self.database.rows)

    @patch("services.api_cache_service.set_cached_value", return_value=False)
    @patch("services.api_cache_service.get_cached_value", return_value=None)
    def test_cache_failure_does_not_hide_provider_response(
        self,
        _mock_get,
        _mock_set
    ):
        provider_value = {"c": 125.50}

        result = api_cache_service.get_or_fetch_cached(
            "quote:AAPL",
            "quote",
            "AAPL",
            lambda: provider_value
        )

        self.assertEqual(result, provider_value)


if __name__ == "__main__":
    unittest.main()
