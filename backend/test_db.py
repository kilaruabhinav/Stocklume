"""Small manual database connectivity smoke check.

Run from the backend directory after creating a local .env:
    python test_db.py
"""

from database import get_db_connection, load_local_env


def main():
    load_local_env()
    connection = get_db_connection()

    try:
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        print("Database connection OK.")
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
