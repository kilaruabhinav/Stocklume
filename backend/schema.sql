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
