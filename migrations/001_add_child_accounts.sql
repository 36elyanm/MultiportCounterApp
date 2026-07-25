-- Adds child accounts: a child user has parent_id set to the parent's
-- user id, sees the parent's counters, and is blocked (server-side) from
-- ever mutating them. Run this once via the D1 dashboard's Console tab
-- against a database that was already set up from the original schema.sql
-- (a fresh database created from the current schema.sql already has this
-- column and doesn't need this file).

ALTER TABLE users ADD COLUMN parent_id TEXT REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
