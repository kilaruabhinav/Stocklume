from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException


MONEY_QUANTUM = Decimal("0.01")


def ensure_simulation_account(cursor, user_id, for_update=False):
    select_account_query = """
        SELECT id, user_id, starting_balance, cash_balance, created_at, updated_at
        FROM simulation_accounts
        WHERE user_id = %s
        FOR UPDATE
        """ if for_update else """
        SELECT id, user_id, starting_balance, cash_balance, created_at, updated_at
        FROM simulation_accounts
        WHERE user_id = %s
        """

    cursor.execute(
        select_account_query,
        (user_id,)
    )

    account = cursor.fetchone()

    if account:
        return account

    cursor.execute(
        """
        INSERT IGNORE INTO simulation_accounts (user_id)
        VALUES (%s)
        """,
        (user_id,)
    )

    cursor.execute(
        select_account_query,
        (user_id,)
    )

    return cursor.fetchone()


def get_simulation_holdings(cursor, user_id):
    cursor.execute(
        """
        SELECT id, user_id, symbol, quantity, average_price, created_at, updated_at
        FROM simulation_holdings
        WHERE user_id = %s
        ORDER BY symbol ASC
        """,
        (user_id,)
    )

    return cursor.fetchall()


def get_simulation_trades(cursor, user_id):
    cursor.execute(
        """
        SELECT id, user_id, symbol, trade_type, quantity, price, total_value, created_at
        FROM simulation_trades
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    return cursor.fetchall()


def buy_simulated_stock(cursor, user_id, symbol, quantity, price):
    total_value = (quantity * price).quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP
    )
    account = ensure_simulation_account(cursor, user_id, for_update=True)

    if account["cash_balance"] < total_value:
        raise HTTPException(
            status_code=400,
            detail="Insufficient virtual cash"
        )

    cursor.execute(
        """
        UPDATE simulation_accounts
        SET cash_balance = cash_balance - %s
        WHERE user_id = %s
        """,
        (total_value, user_id)
    )

    cursor.execute(
        """
        SELECT id, quantity, average_price
        FROM simulation_holdings
        WHERE user_id = %s
        AND symbol = %s
        FOR UPDATE
        """,
        (user_id, symbol)
    )

    holding = cursor.fetchone()

    if holding:
        new_quantity = holding["quantity"] + quantity
        new_average_price = (
            ((holding["quantity"] * holding["average_price"]) + (quantity * price))
            / new_quantity
        )
        cursor.execute(
            """
            UPDATE simulation_holdings
            SET quantity = %s,
                average_price = %s
            WHERE id = %s
            """,
            (new_quantity, new_average_price, holding["id"])
        )
    else:
        cursor.execute(
            """
            INSERT INTO simulation_holdings (user_id, symbol, quantity, average_price)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, symbol, quantity, price)
        )

    insert_trade(cursor, user_id, symbol, "BUY", quantity, price, total_value)
    return total_value


def sell_simulated_stock(cursor, user_id, symbol, quantity, price):
    total_value = (quantity * price).quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP
    )
    ensure_simulation_account(cursor, user_id, for_update=True)

    cursor.execute(
        """
        SELECT id, quantity, average_price
        FROM simulation_holdings
        WHERE user_id = %s
        AND symbol = %s
        FOR UPDATE
        """,
        (user_id, symbol)
    )

    holding = cursor.fetchone()

    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")

    if quantity > holding["quantity"]:
        raise HTTPException(status_code=400, detail="Not enough shares to sell")

    cursor.execute(
        """
        UPDATE simulation_accounts
        SET cash_balance = cash_balance + %s
        WHERE user_id = %s
        """,
        (total_value, user_id)
    )

    remaining_quantity = holding["quantity"] - quantity

    if remaining_quantity == 0:
        cursor.execute(
            "DELETE FROM simulation_holdings WHERE id = %s",
            (holding["id"],)
        )
    else:
        cursor.execute(
            "UPDATE simulation_holdings SET quantity = %s WHERE id = %s",
            (remaining_quantity, holding["id"])
        )

    insert_trade(cursor, user_id, symbol, "SELL", quantity, price, total_value)
    return total_value


def reset_simulation(cursor, user_id):
    ensure_simulation_account(cursor, user_id, for_update=True)
    cursor.execute("DELETE FROM simulation_holdings WHERE user_id = %s", (user_id,))
    cursor.execute("DELETE FROM simulation_trades WHERE user_id = %s", (user_id,))
    cursor.execute(
        """
        UPDATE simulation_accounts
        SET starting_balance = %s,
            cash_balance = %s
        WHERE user_id = %s
        """,
        (Decimal("100000.00"), Decimal("100000.00"), user_id)
    )


def insert_trade(cursor, user_id, symbol, trade_type, quantity, price, total_value):
    cursor.execute(
        """
        INSERT INTO simulation_trades
            (user_id, symbol, trade_type, quantity, price, total_value)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (user_id, symbol, trade_type, quantity, price, total_value)
    )
