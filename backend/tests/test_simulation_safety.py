import sys
import unittest
from decimal import Decimal
from pathlib import Path

from pydantic import ValidationError


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from schemas.simulation import TradeData
from services.simulation_service import buy_simulated_stock


class RecordingCursor:
    def __init__(self):
        self.queries = []
        self.results = [
            {
                "id": 1,
                "user_id": 7,
                "starting_balance": Decimal("100000.00"),
                "cash_balance": Decimal("100000.00"),
                "created_at": None,
                "updated_at": None
            },
            None
        ]

    def execute(self, query, params):
        self.queries.append((" ".join(query.split()), params))

    def fetchone(self):
        return self.results.pop(0)


class SimulationSafetyTests(unittest.TestCase):
    def test_trade_data_normalizes_and_bounds_inputs(self):
        trade = TradeData(symbol=" aapl ", quantity="1.123456")
        self.assertEqual(trade.symbol, "AAPL")
        self.assertEqual(trade.quantity, Decimal("1.123456"))

        invalid_quantities = ("NaN", "Infinity", "0", "-1", "0.0000001")

        for quantity in invalid_quantities:
            with self.subTest(quantity=quantity):
                with self.assertRaises(ValidationError):
                    TradeData(symbol="AAPL", quantity=quantity)

    def test_buy_locks_account_and_rounds_trade_total(self):
        cursor = RecordingCursor()

        total = buy_simulated_stock(
            cursor,
            user_id=7,
            symbol="AAPL",
            quantity=Decimal("1.000000"),
            price=Decimal("10.0050")
        )

        self.assertEqual(total, Decimal("10.01"))
        self.assertIn("FOR UPDATE", cursor.queries[0][0])
        self.assertTrue(
            any("INSERT INTO simulation_trades" in query for query, _ in cursor.queries)
        )


if __name__ == "__main__":
    unittest.main()
