// Declarative SQL schema follows this project's existing append-only migration workflow.
export const coopScoresSchema = `CREATE TABLE coop_scores_v1 (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 run_id TEXT NOT NULL UNIQUE,
 p1_name TEXT NOT NULL, p1_pilot TEXT NOT NULL,
 p2_name TEXT NOT NULL, p2_pilot TEXT NOT NULL,
 faction TEXT NOT NULL CHECK (faction IN ('central','entente')),
 score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 9999),
 duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
export const campaignProgressSchema = `CREATE TABLE campaign_progress (
 profile TEXT NOT NULL,
 stage_id TEXT NOT NULL,
 medals INTEGER NOT NULL CHECK (medals BETWEEN 1 AND 3),
 score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100000),
 best_time REAL NOT NULL CHECK (best_time BETWEEN 0 AND 600),
 cleared_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (profile, stage_id)
)`;
