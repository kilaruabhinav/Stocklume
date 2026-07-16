from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import get_db_connection
from schemas.simulation import TradeData
from services.simulation_service import (
    buy_simulated_stock as buy_stock,
    ensure_simulation_account,
    get_simulation_holdings as fetch_holdings,
    get_simulation_trades as fetch_trades,
    reset_simulation as reset_simulation_data,
    sell_simulated_stock as sell_stock
)
from utils.db_helpers import (
    get_authenticated_user_id,
    serialize_db_row,
    serialize_db_value
)


router = APIRouter()
security = HTTPBearer()


def validate_trade_data(data):
    symbol = data.symbol.strip().upper()

    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required")

    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    if data.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")

    return symbol, data.quantity, data.price


@router.get("/simulation/account")
def get_simulation_account(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        account = ensure_simulation_account(cursor, user_id)
        mydb.commit()

        return {
            "account": serialize_db_row(account)
        }

    finally:
        cursor.close()
        mydb.close()


@router.get("/simulation/holdings")
def get_simulation_holdings(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        return {
            "holdings": [
                serialize_db_row(holding)
                for holding in fetch_holdings(cursor, user_id)
            ]
        }

    finally:
        cursor.close()
        mydb.close()


@router.get("/simulation/trades")
def get_simulation_trades(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        return {
            "trades": [
                serialize_db_row(trade)
                for trade in fetch_trades(cursor, user_id)
            ]
        }

    finally:
        cursor.close()
        mydb.close()


@router.post("/simulation/buy")
def buy_simulated_stock(
    data: TradeData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    symbol, quantity, price = validate_trade_data(data)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        total_value = buy_stock(cursor, user_id, symbol, quantity, price)
        mydb.commit()

        return trade_response(
            "Buy order executed",
            symbol,
            quantity,
            price,
            total_value
        )

    except Exception:
        mydb.rollback()
        raise

    finally:
        cursor.close()
        mydb.close()


@router.post("/simulation/sell")
def sell_simulated_stock(
    data: TradeData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    symbol, quantity, price = validate_trade_data(data)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        total_value = sell_stock(cursor, user_id, symbol, quantity, price)
        mydb.commit()

        return trade_response(
            "Sell order executed",
            symbol,
            quantity,
            price,
            total_value
        )

    except Exception:
        mydb.rollback()
        raise

    finally:
        cursor.close()
        mydb.close()


@router.post("/simulation/reset")
def reset_simulation(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        reset_simulation_data(cursor, user_id)
        mydb.commit()

        return {
            "message": "Simulation reset successfully"
        }

    except Exception:
        mydb.rollback()
        raise

    finally:
        cursor.close()
        mydb.close()


def trade_response(message, symbol, quantity, price, total_value):
    return {
        "message": message,
        "trade": {
            "symbol": symbol,
            "quantity": serialize_db_value(quantity),
            "price": serialize_db_value(price),
            "total_value": serialize_db_value(total_value)
        }
    }
