CREATE TABLE IF NOT EXISTS coop_scores_v1 (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 run_id TEXT NOT NULL UNIQUE,
 p1_name TEXT NOT NULL,
 p1_pilot TEXT NOT NULL,
 p2_name TEXT NOT NULL,
 p2_pilot TEXT NOT NULL,
 faction TEXT NOT NULL CHECK (faction IN ('central','entente')),
 score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 9999),
 duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coop_scores_v1_ranking ON coop_scores_v1(score DESC,id ASC);
