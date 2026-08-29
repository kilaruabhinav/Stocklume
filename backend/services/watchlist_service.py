from fastapi import HTTPException


def normalize_symbol(symbol):
    normalized_symbol = symbol.strip().upper()

    if not normalized_symbol:
        raise HTTPException(
            status_code=400,
            detail="Symbol is required"
        )

    return normalized_symbol


def get_watchlist_items(cursor, user_id):
    cursor.execute(
        """
        SELECT id, symbol, created_at
        FROM watchlist
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    return cursor.fetchall()


def add_watchlist_item(cursor, user_id, symbol):
    cursor.execute(
        """
        INSERT INTO watchlist (user_id, symbol)
        VALUES (%s, %s)
        ON CONFLICT (user_id, symbol) DO NOTHING
        RETURNING id
        """,
        (user_id, symbol)
    )

    row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=409,
            detail="Stock already exists in watchlist"
        )

    return row["id"]


def delete_watchlist_item(cursor, user_id, symbol):
    cursor.execute(
        """
        DELETE FROM watchlist
        WHERE user_id = %s
        AND symbol = %s
        """,
        (user_id, symbol)
    )

    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Stock not found in watchlist"
        )
