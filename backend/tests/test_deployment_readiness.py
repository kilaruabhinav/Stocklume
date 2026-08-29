import sys
import unittest
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient

from database import get_database_port, get_db_connection
from main import app


class DeploymentReadinessTests(unittest.TestCase):
    def test_health_endpoint_is_lightweight(self):
        response = TestClient(app).get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_database_port_defaults_to_postgresql_port(self):
        with patch.dict("os.environ", {}, clear=True):
            self.assertEqual(get_database_port(), 5432)

    @patch("database.psycopg.connect")
    def test_database_connection_uses_postgresql_tls_port_and_timeout(
        self,
        mock_connect
    ):
        environment = {
            "DB_HOST": "database.internal",
            "DB_PORT": "5432",
            "DB_USER": "stocklume",
            "DB_PASSWORD": "test-password",
            "DB_NAME": "stocklume",
        }

        with patch.dict("os.environ", environment, clear=True):
            get_db_connection()

        call_options = mock_connect.call_args.kwargs
        self.assertEqual(call_options["port"], 5432)
        self.assertEqual(call_options["connect_timeout"], 10)
        self.assertEqual(call_options["sslmode"], "require")
        self.assertIn("row_factory", call_options)


if __name__ == "__main__":
    unittest.main()
