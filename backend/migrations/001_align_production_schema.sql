-- Review and back up the target database before applying this migration.
-- The checks intentionally fail if legacy rows contain invalid simulation values.

ALTER TABLE users
    MODIFY name VARCHAR(255) NOT NULL;

ALTER TABLE watchlist
    MODIFY symbol VARCHAR(32) NOT NULL;

ALTER TABLE simulation_accounts
    MODIFY starting_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000.00,
    MODIFY cash_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000.00,
    ADD CONSTRAINT chk_simulation_starting_balance
        CHECK (starting_balance >= 0),
    ADD CONSTRAINT chk_simulation_cash_balance
        CHECK (cash_balance >= 0);

ALTER TABLE simulation_holdings
    MODIFY quantity DECIMAL(18, 6) NOT NULL,
    MODIFY average_price DECIMAL(18, 4) NOT NULL,
    ADD CONSTRAINT chk_simulation_holding_quantity
        CHECK (quantity > 0),
    ADD CONSTRAINT chk_simulation_holding_average_price
        CHECK (average_price > 0);

ALTER TABLE simulation_trades
    MODIFY quantity DECIMAL(18, 6) NOT NULL,
    MODIFY price DECIMAL(18, 4) NOT NULL,
    MODIFY total_value DECIMAL(18, 2) NOT NULL,
    ADD INDEX idx_simulation_trades_user_created_at (user_id, created_at),
    ADD CONSTRAINT chk_simulation_trade_quantity
        CHECK (quantity > 0),
    ADD CONSTRAINT chk_simulation_trade_price
        CHECK (price > 0),
    ADD CONSTRAINT chk_simulation_trade_total
        CHECK (total_value > 0);
