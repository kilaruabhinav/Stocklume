from decimal import Decimal

from pydantic import BaseModel


class TradeData(BaseModel):
    symbol: str
    quantity: Decimal
