/**
 * SQLite access. Everything that touches the database goes through here.
 *
 * Local first. There is no network call anywhere in this file and there must
 * never be one. Adding sync or accounts changes our HIPAA and FTC posture and
 * requires an explicit recorded decision in docs/PRODUCT.md first.
 */

import * as SQLite from 'expo-sqlite';

import { dateKey, nowISO } from '../domain/dates';
import {
  Change,
  ChangeKind,
  Draft,
  Entry,
  EntryKind,
  Settings,
  Stage,
  defaultSettings,
} from '../domain/types';
import { MIGRATIONS } from './schema';

const DB_NAME = 'kasey.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await migrate(db);
    return db;
  })();
  return dbPromise;
}

/** Exposed for tests, which need a clean handle per run. */
export function _resetDbForTests(): void {
  dbPromise = null;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    await db.withTransactionAsync(async () => {
      for (const stmt of m.statements) await db.execAsync(stmt);
    });
    // PRAGMA cannot be parameterised
    await db.execAsync(`PRAGMA user_version = ${m.version}`);
  }
}

function id(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/* ------------------------------------------------------------------ *
 * entries
 * ------------------------------------------------------------------ */

interface EntryRow {
  id: string;
  at: string;
  kind: string;
  stage: number | null;
  trigger: string | null;
  behaviors: string;
  tools: string;
  minutes: number | null;
  source: string;
  note: string | null;
  flagged: number;
  created_at: string;
  updated_at: string | null;
}

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function toEntry(r: EntryRow): Entry {
  return {
    id: r.id,
    at: r.at,
    kind: r.kind as EntryKind,
    stage: (r.stage as Stage | null) ?? null,
    trigger: r.trigger,
    behaviors: parseJsonArray(r.behaviors),
    tools: parseJsonArray(r.tools),
    minutes: r.minutes,
    source: r.source,
    note: r.note,
    flagged: r.flagged === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function listEntries(): Promise<Entry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY at DESC');
  return rows.map(toEntry);
}

export async function getEntry(entryId: string): Promise<Entry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE id = ?', entryId);
  return row ? toEntry(row) : null;
}

export type NewEntry = Omit<Entry, 'id' | 'created_at' | 'updated_at'>;

export async function insertEntry(e: NewEntry): Promise<Entry> {
  const db = await getDb();
  const created = nowISO();
  const entry: Entry = { ...e, id: id(), created_at: created, updated_at: null };

  await db.runAsync(
    `INSERT INTO entries
      (id, at, kind, stage, trigger, behaviors, tools, minutes, source, note, flagged, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    entry.id,
    entry.at,
    entry.kind,
    entry.stage,
    entry.trigger,
    JSON.stringify(entry.behaviors),
    JSON.stringify(entry.tools),
    entry.minutes,
    entry.source,
    entry.note,
    entry.flagged ? 1 : 0,
    entry.created_at,
    null,
  );
  return entry;
}

/** Updates keep an audit trail: created_at never moves, updated_at is stamped. */
export async function updateEntry(entry: Entry): Promise<Entry> {
  const db = await getDb();
  const updated = { ...entry, updated_at: nowISO() };

  await db.runAsync(
    `UPDATE entries SET
       at=?, kind=?, stage=?, trigger=?, behaviors=?, tools=?, minutes=?,
       source=?, note=?, flagged=?, updated_at=?
     WHERE id=?`,
    updated.at,
    updated.kind,
    updated.stage,
    updated.trigger,
    JSON.stringify(updated.behaviors),
    JSON.stringify(updated.tools),
    updated.minutes,
    updated.source,
    updated.note,
    updated.flagged ? 1 : 0,
    updated.updated_at,
    updated.id,
  );
  return updated;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', entryId);
}

/**
 * The good day entry for a calendar date, if one exists.
 * Used to keep the button to one per day and to relabel it by state.
 */
export async function goodDayFor(date: Date | string): Promise<Entry | null> {
  const key = dateKey(date);
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>(
    "SELECT * FROM entries WHERE kind = 'good' ORDER BY at DESC",
  );
  const found = rows.map(toEntry).find((e) => dateKey(e.at) === key);
  return found ?? null;
}

/* ------------------------------------------------------------------ *
 * changes
 * ------------------------------------------------------------------ */

interface ChangeRow {
  id: string;
  kind: string;
  label: string;
  dose: string;
  start: string;
  end: string | null;
  note: string;
}

function toChange(r: ChangeRow): Change {
  return { ...r, kind: r.kind as ChangeKind };
}

export async function listChanges(): Promise<Change[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ChangeRow>('SELECT * FROM changes ORDER BY start DESC');
  return rows.map(toChange);
}

export async function insertChange(c: Omit<Change, 'id'>): Promise<Change> {
  const db = await getDb();
  const change: Change = { ...c, id: id() };
  await db.runAsync(
    'INSERT INTO changes (id, kind, label, dose, start, end, note) VALUES (?,?,?,?,?,?,?)',
    change.id,
    change.kind,
    change.label,
    change.dose,
    change.start,
    change.end,
    change.note,
  );
  return change;
}

export async function updateChange(change: Change): Promise<Change> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE changes SET kind=?, label=?, dose=?, start=?, end=?, note=? WHERE id=?',
    change.kind,
    change.label,
    change.dose,
    change.start,
    change.end,
    change.note,
    change.id,
  );
  return change;
}

export async function deleteChange(changeId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM changes WHERE id = ?', changeId);
}

/**
 * Stopping a medication sets an end date on THAT record only.
 *
 * It must never touch any other record. Ending the previous medication when a
 * new one starts is the exact bug described in PRODUCT.md rule 8: it silently
 * records a drug as stopped and produces a false clinical statement.
 */
export async function stopMedication(changeId: string, endDate: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE changes SET end = ? WHERE id = ?', endDate, changeId);
}

/**
 * A dose change closes the old record and opens a new one, so the sequence
 * survives and the clinician can see the history rather than just the latest.
 */
export async function changeDose(
  existing: Change,
  newDose: string,
  when: string,
  note = '',
): Promise<Change> {
  await stopMedication(existing.id, when);
  return insertChange({
    kind: 'med',
    label: existing.label,
    dose: newDose,
    start: when,
    end: null,
    note,
  });
}

/* ------------------------------------------------------------------ *
 * settings
 * ------------------------------------------------------------------ */

export async function loadSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM settings WHERE id = 1');
  if (!row) return defaultSettings();
  try {
    const parsed = JSON.parse(row.json) as Partial<Settings>;
    const base = defaultSettings();
    return { ...base, ...parsed, lib: { ...base.lib, ...(parsed.lib ?? {}) } };
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json',
    JSON.stringify(s),
  );
}

/* ------------------------------------------------------------------ *
 * draft
 * ------------------------------------------------------------------ */

export async function loadDraft(): Promise<Draft | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM draft WHERE id = 1');
  if (!row) return null;
  try {
    return JSON.parse(row.json) as Draft;
  } catch {
    return null;
  }
}

export async function saveDraft(d: Draft): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO draft (id, json, saved_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json, saved_at = excluded.saved_at`,
    JSON.stringify(d),
    nowISO(),
  );
}

export async function clearDraft(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM draft WHERE id = 1');
}

/* ------------------------------------------------------------------ *
 * backup and restore
 *
 * A requirement, not a feature. A lost phone must not destroy months of a
 * child's medical history. Export is explicit and user initiated.
 * ------------------------------------------------------------------ */

export interface Backup {
  format: 'kasey-backup';
  version: number;
  exported_at: string;
  settings: Settings;
  entries: Entry[];
  changes: Change[];
}

export async function exportBackup(): Promise<Backup> {
  return {
    format: 'kasey-backup',
    version: 1,
    exported_at: nowISO(),
    settings: await loadSettings(),
    entries: await listEntries(),
    changes: await listChanges(),
  };
}

export class RestoreError extends Error {}

/**
 * Replaces everything. Validates before deleting, so a malformed file cannot
 * leave the user with neither their old data nor their new data.
 */
export async function restoreBackup(raw: unknown): Promise<void> {
  const b = raw as Partial<Backup>;
  if (!b || b.format !== 'kasey-backup') {
    throw new RestoreError('That file is not a Kasey backup.');
  }
  if (!Array.isArray(b.entries) || !Array.isArray(b.changes)) {
    throw new RestoreError('That backup is missing its entries.');
  }

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM entries');
    await db.execAsync('DELETE FROM changes');

    for (const e of b.entries as Entry[]) {
      await db.runAsync(
        `INSERT INTO entries
          (id, at, kind, stage, trigger, behaviors, tools, minutes, source, note, flagged, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        e.id,
        e.at,
        e.kind,
        e.stage,
        e.trigger,
        JSON.stringify(e.behaviors ?? []),
        JSON.stringify(e.tools ?? []),
        e.minutes,
        e.source,
        e.note,
        e.flagged ? 1 : 0,
        e.created_at,
        e.updated_at,
      );
    }
    for (const c of b.changes as Change[]) {
      await db.runAsync(
        'INSERT INTO changes (id, kind, label, dose, start, end, note) VALUES (?,?,?,?,?,?,?)',
        c.id,
        c.kind,
        c.label,
        c.dose ?? '',
        c.start,
        c.end,
        c.note ?? '',
      );
    }
  });

  if (b.settings) await saveSettings(b.settings as Settings);
}

export async function eraseEverything(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM entries');
    await db.execAsync('DELETE FROM changes');
    await db.execAsync('DELETE FROM draft');
    await db.execAsync('DELETE FROM settings');
  });
}
