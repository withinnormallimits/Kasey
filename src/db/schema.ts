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

export const SCHEMA_VERSION = 2;

/**
 * The single child this version records. v1 is deliberately single child, but
 * the column exists from the first shipped schema so that adding a second
 * child later is an interface change rather than a data migration.
 *
 * Why this matters here specifically: this app is local-first with no server.
 * A post-launch migration runs once, on every parent's device, with no
 * telemetry, no canary, and no way to fix a bad one remotely. Two of the three
 * production bugs recorded in PRODUCT.md produced false clinical statements on
 * a document handed to a doctor; a botched migration is worse, because it
 * destroys rows rather than mis-rendering them. Sibling recurrence of autism
 * runs about 20%, so a second child is not a rare edge case, which makes
 * paying this cost now the cheap option.
 */
export const DEFAULT_CHILD_ID = 'child-1';

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
  {
    // Groundwork only. Nothing in the interface reads or writes this yet, and
    // there is no profile picker. Every row belongs to DEFAULT_CHILD_ID.
    //
    // ADD COLUMN is cheap and non-destructive, which is exactly why it is
    // worth doing before there is data on anyone's phone. The `settings` and
    // `draft` tables are deliberately left alone: they are pinned to a single
    // row by CHECK (id = 1), and SQLite cannot drop a constraint, so widening
    // them later needs a full table rebuild. That rebuild is the expensive,
    // irreversible part, and it stays out of scope until multi-child is
    // actually a decision rather than a possibility.
    version: 2,
    statements: [
      `ALTER TABLE entries ADD COLUMN child_id TEXT NOT NULL DEFAULT '${DEFAULT_CHILD_ID}'`,
      `ALTER TABLE changes ADD COLUMN child_id TEXT NOT NULL DEFAULT '${DEFAULT_CHILD_ID}'`,
      // settings stays a single pinned row for now; the column is here so the
      // shape is consistent when a children table eventually replaces it.
      `ALTER TABLE settings ADD COLUMN child_id TEXT NOT NULL DEFAULT '${DEFAULT_CHILD_ID}'`,
      `CREATE INDEX IF NOT EXISTS idx_entries_child_at ON entries (child_id, at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_changes_child_start ON changes (child_id, start DESC)`,
    ],
  },
];
