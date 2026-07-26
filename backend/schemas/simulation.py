import re
from decimal import Decimal

from pydantic import BaseModel, field_validator


SYMBOL_PATTERN = re.compile(r"^[A-Z0-9.^:-]+$")
MAX_TRADE_QUANTITY = Decimal("999999999999.999999")


class TradeData(BaseModel):
    symbol: str
    quantity: Decimal

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, value):
        normalized = value.strip().upper()

        if not normalized:
            raise ValueError("Symbol is required")

        if len(normalized) > 32 or not SYMBOL_PATTERN.fullmatch(normalized):
            raise ValueError("Symbol format is invalid")

        return normalized

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value):
        if not value.is_finite() or value <= 0:
            raise ValueError("Quantity must be a finite number greater than 0")

        if value > MAX_TRADE_QUANTITY or value.as_tuple().exponent < -6:
            raise ValueError("Quantity exceeds the supported size or precision")

        return value
