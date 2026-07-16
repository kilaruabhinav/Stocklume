-- Stocklume MySQL schema
-- Run this file once for a new local database before starting the FastAPI backend.

-- Stores registered application users.
-- Passwords are stored as hashes created by backend/security.py, never as plain text.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores each user's saved symbols.
-- The unique key prevents the same user from saving the same symbol twice.
-- Deleting a user automatically deletes that user's watchlist rows.
CREATE TABLE IF NOT EXISTS watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    CONSTRAINT fk_watchlist_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Stores each user's virtual simulation account.
-- Accounts start with $100,000 in virtual cash.
CREATE TABLE IF NOT EXISTS simulation_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    starting_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000.00,
    cash_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_simulation_account_user (user_id),
    CONSTRAINT fk_simulation_account_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Stores the user's current virtual holdings.
-- The unique key keeps one row per user and symbol; buys update quantity and average price.
CREATE TABLE IF NOT EXISTS simulation_holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    quantity DECIMAL(18, 6) NOT NULL,
    average_price DECIMAL(18, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_simulation_holding_user_symbol (user_id, symbol),
    CONSTRAINT fk_simulation_holding_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Stores the user's virtual buy/sell trade history.
CREATE TABLE IF NOT EXISTS simulation_trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    trade_type VARCHAR(8) NOT NULL,
    quantity DECIMAL(18, 6) NOT NULL,
    price DECIMAL(18, 4) NOT NULL,
    total_value DECIMAL(18, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_simulation_trades_user_created_at (user_id, created_at),
    CONSTRAINT fk_simulation_trade_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
