import logging
import os
from pathlib import Path

import mysql.connector


logger = logging.getLogger(__name__)
DEFAULT_DB_PORT = 3306
DB_CONNECTION_TIMEOUT_SECONDS = 10


def load_local_env():
    env_path = Path(__file__).resolve().parent / ".env"

    if not env_path.exists():
        return

    for line in env_path.read_text().splitlines():
        stripped_line = line.strip()

        if not stripped_line or stripped_line.startswith("#") or "=" not in stripped_line:
            continue

        key, value = stripped_line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_local_env()


def require_environment_variable(name):
    value = os.environ.get(name)

    if not value:
        raise RuntimeError(f"Required environment variable is missing: {name}")

    return value


def get_database_port():
    raw_port = os.environ.get("DB_PORT", str(DEFAULT_DB_PORT))

    try:
        port = int(raw_port)
    except ValueError:
        raise RuntimeError("DB_PORT must be a valid integer")

    if not 1 <= port <= 65535:
        raise RuntimeError("DB_PORT must be between 1 and 65535")

    return port


def get_database_ssl_options():
    ssl_ca = os.environ.get("DB_SSL_CA")

    if not ssl_ca:
        return {}

    return {
        "ssl_ca": ssl_ca,
        "ssl_verify_cert": True,
        "ssl_verify_identity": True
    }


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=require_environment_variable("DB_HOST"),
            port=get_database_port(),
            user=require_environment_variable("DB_USER"),
            password=require_environment_variable("DB_PASSWORD"),
            database=require_environment_variable("DB_NAME"),
            connection_timeout=DB_CONNECTION_TIMEOUT_SECONDS,
            **get_database_ssl_options()
        )
    except mysql.connector.Error as error:
        logger.error(
            "Database connection failed: error=%s",
            type(error).__name__
        )
        raise

    return connection
