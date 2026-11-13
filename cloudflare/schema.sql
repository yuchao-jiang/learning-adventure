CREATE TABLE IF NOT EXISTS progress (
 child TEXT PRIMARY KEY CHECK (child IN ('emily', 'jason')),
 document TEXT NOT NULL CHECK (json_valid(document)),
 revision TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_attempts (
 client TEXT NOT NULL,
 bucket INTEGER NOT NULL,
 attempts INTEGER NOT NULL,
 PRIMARY KEY (client, bucket)
);
CREATE TABLE IF NOT EXISTS device_sessions (
 token_hash TEXT PRIMARY KEY,
 expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_events (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 event_id TEXT NOT NULL UNIQUE,
 learner TEXT NOT NULL CHECK (learner IN ('emily','jason')),
 occurred_at TEXT NOT NULL,
 document TEXT NOT NULL CHECK (json_valid(document))
);
CREATE INDEX IF NOT EXISTS learning_events_learner_seq ON learning_events (learner, seq);
