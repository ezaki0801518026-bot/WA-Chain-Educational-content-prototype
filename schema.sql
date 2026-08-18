-- D1 schema for the anonymous learning-event log (functions/api/event.js).
-- Apply with:
--   npx wrangler d1 execute washi-events --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT,
  section TEXT,
  detail TEXT,
  lang TEXT,
  ua TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events (type);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
