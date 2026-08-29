import logging
import os
from pathlib import Path

import psycopg
from psycopg.rows import dict_row


logger = logging.getLogger(__name__)

DEFAULT_DB_PORT = 5432
DB_CONNECTION_TIMEOUT_SECONDS = 10


def load_local_env():
    env_path = Path(__file__).resolve().parent / ".env"

    if not env_path.exists():
        return

    for line in env_path.read_text().splitlines():
        stripped_line = line.strip()

        if (
            not stripped_line
            or stripped_line.startswith("#")
            or "=" not in stripped_line
        ):
            continue

        key, value = stripped_line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_local_env()


def require_environment_variable(name):
    value = os.environ.get(name)

    if not value:
        raise RuntimeError(
            f"Required environment variable is missing: {name}"
        )

    return value


def get_database_port():
    raw_port = os.environ.get(
        "DB_PORT",
        str(DEFAULT_DB_PORT)
    )

    try:
        port = int(raw_port)
    except ValueError:
        raise RuntimeError("DB_PORT must be a valid integer")

    if not 1 <= port <= 65535:
        raise RuntimeError(
            "DB_PORT must be between 1 and 65535"
        )

    return port


def get_db_connection():
    try:
        connection = psycopg.connect(
            host=require_environment_variable("DB_HOST"),
            port=get_database_port(),
            user=require_environment_variable("DB_USER"),
            password=require_environment_variable("DB_PASSWORD"),
            dbname=require_environment_variable("DB_NAME"),
            connect_timeout=DB_CONNECTION_TIMEOUT_SECONDS,
            sslmode="require",
            row_factory=dict_row
        )
    except psycopg.Error as error:
        logger.error(
            "Database connection failed: error=%s",
            type(error).__name__
        )
        raise

    return connection
