import json
import logging
import threading

from database import get_db_connection
from psycopg.types.json import Jsonb


logger = logging.getLogger(__name__)

CACHE_TTL = {
    "quote": 30,
    "search": 10 * 60,
    "profile": 24 * 60 * 60,
    "metrics": 10 * 60,
    "company_news": 10 * 60,
    "general_news": 10 * 60,
    "historical_chart": 15 * 60,
    "financial_details": 12 * 60 * 60
}

CACHE_LOCK_COUNT = 64
CACHE_LOCKS = tuple(threading.Lock() for _ in range(CACHE_LOCK_COUNT))
CLEANUP_EVERY_WRITES = 100
CLEANUP_ROW_LIMIT = 500
_write_count = 0
_write_count_lock = threading.Lock()


def get_cached_value(cache_key):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT response_data, expires_at > NOW() AS is_valid
            FROM api_cache
            WHERE cache_key = %s
            """,
            (cache_key,)
        )
        row = cursor.fetchone()

        if not row:
            logger.debug("CACHE MISS %s", cache_key)
            return None

        if not row["is_valid"]:
            logger.debug("CACHE EXPIRED %s", cache_key)
            return None

        value = deserialize_json_value(row["response_data"])
        logger.debug("CACHE HIT %s", cache_key)
        return value
    except Exception:
        logger.exception("Cache lookup failed: cache_key=%s", cache_key)
        return None
    finally:
        close_cache_resources(cursor, connection)


def set_cached_value(cache_key, data_type, symbol, response_data, ttl_seconds):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO api_cache
                (
                    cache_key,
                    data_type,
                    symbol,
                    response_data,
                    fetched_at,
                    expires_at
                )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP + (%s * INTERVAL '1 second')
            )
            ON CONFLICT (cache_key) DO UPDATE
            SET data_type = EXCLUDED.data_type,
                symbol = EXCLUDED.symbol,
                response_data = EXCLUDED.response_data,
                fetched_at = CURRENT_TIMESTAMP,
                expires_at = EXCLUDED.expires_at
            """,
            (
                cache_key,
                data_type,
                symbol,
                Jsonb(response_data),
                ttl_seconds
            )
        )

        if should_cleanup_expired_rows():
            cursor.execute(
                """
                WITH expired_rows AS (
                    SELECT id
                    FROM api_cache
                    WHERE expires_at < CURRENT_TIMESTAMP
                    ORDER BY expires_at
                    LIMIT %s
                )
                DELETE FROM api_cache
                WHERE id IN (SELECT id FROM expired_rows)
                """,
                (CLEANUP_ROW_LIMIT,)
            )

        connection.commit()
        logger.debug("CACHE WRITE %s", cache_key)
        return True
    except Exception:
        if connection is not None:
            connection.rollback()

        logger.exception("Cache write failed: cache_key=%s", cache_key)
        return False
    finally:
        close_cache_resources(cursor, connection)


def delete_cached_value(cache_key):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "DELETE FROM api_cache WHERE cache_key = %s",
            (cache_key,)
        )
        connection.commit()
        return cursor.rowcount > 0
    except Exception:
        if connection is not None:
            connection.rollback()

        logger.exception("Cache delete failed: cache_key=%s", cache_key)
        return False
    finally:
        close_cache_resources(cursor, connection)


def get_or_fetch_cached(
    cache_key,
    data_type,
    symbol,
    fetch_value,
    ttl_seconds=None
):
    cached_value = get_cached_value(cache_key)

    if cached_value is not None:
        return cached_value

    cache_lock = CACHE_LOCKS[hash(cache_key) % CACHE_LOCK_COUNT]

    with cache_lock:
        cached_value = get_cached_value(cache_key)

        if cached_value is not None:
            return cached_value

        response_data = fetch_value()

        if is_cacheable_response(response_data):
            set_cached_value(
                cache_key,
                data_type,
                symbol,
                response_data,
                ttl_seconds or CACHE_TTL[data_type]
            )

        return response_data


def deserialize_json_value(value):
    if isinstance(value, (dict, list, int, float, bool)) or value is None:
        return value

    if isinstance(value, bytes):
        value = value.decode("utf-8")

    return json.loads(value)


def is_cacheable_response(value):
    if not isinstance(value, (dict, list)):
        return False

    if isinstance(value, dict):
        provider_error_fields = (
            "error",
            "Error Message",
            "Note",
            "Information"
        )

        if any(value.get(field) for field in provider_error_fields):
            return False

        if str(value.get("status", "")).lower() == "error":
            return False

    return True


def should_cleanup_expired_rows():
    global _write_count

    with _write_count_lock:
        _write_count += 1
        return _write_count % CLEANUP_EVERY_WRITES == 0


def close_cache_resources(cursor, connection):
    try:
        if cursor is not None:
            cursor.close()
    except Exception:
        logger.exception("Failed to close cache cursor")

    try:
        if connection is not None:
            connection.close()
    except Exception:
        logger.exception("Failed to close cache database connection")
