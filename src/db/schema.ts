/**
 * SQLite schema, from docs/SPEC.md.
 *
 * All timestamps are ISO 8601 local time strings. Never epoch integers, and
 * never UTC Z strings; see src/domain/dates.ts for why the local calendar date
 * is load bearing.
 *
 * Migrations are forward only and numbered. user_version tracks which have
 * run. Never rewrite an existing migration once it has shipped; add another.
 */

export const SCHEMA_VERSION = 1;

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS entries (
        id          TEXT PRIMARY KEY NOT NULL,
        at          TEXT NOT NULL,
        kind        TEXT NOT NULL CHECK (kind IN ('episode','good')),
        stage       INTEGER CHECK (stage IS NULL OR stage BETWEEN 1 AND 4),
        trigger     TEXT,
        behaviors   TEXT NOT NULL DEFAULT '[]',
        tools       TEXT NOT NULL DEFAULT '[]',
        minutes     INTEGER,
        source      TEXT NOT NULL DEFAULT 'Home',
        note        TEXT,
        flagged     INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL,
        updated_at  TEXT,
        -- an episode must carry a stage and a recovery time; a good day must not
        CHECK (kind <> 'episode' OR (stage IS NOT NULL AND minutes IS NOT NULL)),
        CHECK (kind <> 'good' OR (stage IS NULL AND minutes IS NULL))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_entries_at ON entries (at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_entries_kind_at ON entries (kind, at DESC)`,

      `CREATE TABLE IF NOT EXISTS changes (
        id     TEXT PRIMARY KEY NOT NULL,
        kind   TEXT NOT NULL CHECK (kind IN ('med','therapy','school','other')),
        label  TEXT NOT NULL,
        dose   TEXT NOT NULL DEFAULT '',
        start  TEXT NOT NULL,
        -- NULL means still current. Never inferred from the next record's start.
        end    TEXT,
        note   TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE INDEX IF NOT EXISTS idx_changes_start ON changes (start DESC)`,

      // single row, id pinned to 1
      `CREATE TABLE IF NOT EXISTS settings (
        id    INTEGER PRIMARY KEY CHECK (id = 1),
        json  TEXT NOT NULL
      )`,

      // single nullable row holding the in progress entry
      `CREATE TABLE IF NOT EXISTS draft (
        id    INTEGER PRIMARY KEY CHECK (id = 1),
        json  TEXT NOT NULL,
        saved_at TEXT NOT NULL
      )`,
    ],
  },
];
