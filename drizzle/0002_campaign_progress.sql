CREATE TABLE campaign_progress (
 profile TEXT NOT NULL,
 stage_id TEXT NOT NULL,
 medals INTEGER NOT NULL CHECK (medals BETWEEN 1 AND 3),
 score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100000),
 best_time REAL NOT NULL CHECK (best_time BETWEEN 0 AND 600),
 cleared_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (profile, stage_id)
);
