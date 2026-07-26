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

    def test_database_port_defaults_to_mysql_port(self):
        with patch.dict("os.environ", {}, clear=True):
            self.assertEqual(get_database_port(), 3306)

    @patch("database.mysql.connector.connect")
    def test_database_connection_uses_configured_port_and_timeout(
        self,
        mock_connect
    ):
        environment = {
            "DB_HOST": "database.internal",
            "DB_PORT": "3307",
            "DB_USER": "stocklume",
            "DB_PASSWORD": "test-password",
            "DB_NAME": "stocklume",
            "DB_SSL_CA": "/secure/provider-ca.pem"
        }

        with patch.dict("os.environ", environment, clear=True):
            get_db_connection()

        call_options = mock_connect.call_args.kwargs
        self.assertEqual(call_options["port"], 3307)
        self.assertEqual(call_options["connection_timeout"], 10)
        self.assertEqual(call_options["ssl_ca"], "/secure/provider-ca.pem")
        self.assertTrue(call_options["ssl_verify_cert"])
        self.assertTrue(call_options["ssl_verify_identity"])


if __name__ == "__main__":
    unittest.main()
