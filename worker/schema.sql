CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Dishes the user overrode after an analysis. No photo is stored — only the names,
-- so we can find which lookalike pairs the model actually gets wrong in the field.
CREATE TABLE IF NOT EXISTS dish_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted TEXT NOT NULL,
  corrected TEXT NOT NULL,
  confidence REAL,
  was_offered INTEGER NOT NULL DEFAULT 0,
  lang TEXT,
  model TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dish_corrections_pair
  ON dish_corrections (predicted, corrected);
