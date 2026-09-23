CREATE TABLE IF NOT EXISTS priority_scores_161 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  pilot TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS priority_scores_161_order
  ON priority_scores_161(score DESC, created_at ASC);

DELETE FROM coop_scores_v1;

DELETE FROM sqlite_sequence
WHERE name IN ('priority_scores_161', 'coop_scores_v1');
