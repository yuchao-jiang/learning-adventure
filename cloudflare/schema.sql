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
