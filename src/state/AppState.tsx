/**
 * Application state. One store, loaded from SQLite on boot and written
 * through on every change, so a force quit never loses more than the current
 * debounce window.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import * as db from '../db/database';
import { dateKey, nowISO } from '../domain/dates';
import { Change, Draft, Entry, Settings, defaultSettings } from '../domain/types';
import { Palette, ThemeName, palettes } from '../theme/tokens';

/** Written on this debounce. Mobile form abandonment runs around 81% and
 *  losing work is the biggest source of frustrated language in mobile forms. */
const DRAFT_DEBOUNCE_MS = 400;

interface AppStateValue {
  ready: boolean;
  settings: Settings;
  entries: Entry[];
  changes: Change[];
  draft: Draft | null;

  theme: ThemeName;
  palette: Palette;

  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  addEntry: (e: db.NewEntry) => Promise<Entry>;
  editEntry: (e: Entry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;

  /** One tap, with undo. No streak, no guilt, ever. */
  markGoodDay: (note?: string) => Promise<Entry | null>;
  goodDayToday: Entry | null;
  episodesToday: Entry[];

  addChange: (c: Omit<Change, 'id'>) => Promise<void>;
  editChange: (c: Change) => Promise<void>;
  removeChange: (id: string) => Promise<void>;
  stopMed: (id: string, end: string) => Promise<void>;
  changeDose: (existing: Change, dose: string, when: string, note?: string) => Promise<void>;

  setDraft: (d: Draft | null) => void;
  discardDraft: () => Promise<void>;

  restore: (raw: unknown) => Promise<void>;
  eraseAll: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [draft, setDraftState] = useState<Draft | null>(null);

  const scheme = useColorScheme();
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    const [s, e, c, d] = await Promise.all([
      db.loadSettings(),
      db.listEntries(),
      db.listChanges(),
      db.loadDraft(),
    ]);
    setSettings(s);
    setEntries(e);
    setChanges(c);
    setDraftState(d);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const theme: ThemeName =
    settings.theme === 'auto' ? (scheme === 'dark' ? 'dark' : 'light') : settings.theme;
  const palette = palettes[theme];

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await db.saveSettings(next);
    },
    [settings],
  );

  const addEntry = useCallback(async (e: db.NewEntry) => {
    const created = await db.insertEntry(e);
    setEntries((prev) => [created, ...prev].sort((a, b) => b.at.localeCompare(a.at)));
    return created;
  }, []);

  const editEntry = useCallback(async (e: Entry) => {
    const updated = await db.updateEntry(e);
    setEntries((prev) =>
      prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => b.at.localeCompare(a.at)),
    );
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await db.deleteEntry(id);
    setEntries((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const todayKey = dateKey(new Date());
  const goodDayToday = useMemo(
    () => entries.find((e) => e.kind === 'good' && dateKey(e.at) === todayKey) ?? null,
    [entries, todayKey],
  );
  const episodesToday = useMemo(
    () => entries.filter((e) => e.kind === 'episode' && dateKey(e.at) === todayKey),
    [entries, todayKey],
  );

  const markGoodDay = useCallback(
    async (note?: string) => {
      // one verdict per date. Tapping again edits the note rather than stacking.
      if (goodDayToday) {
        await editEntry({ ...goodDayToday, note: note ?? goodDayToday.note });
        return null;
      }
      return addEntry({
        at: nowISO(),
        kind: 'good',
        stage: null,
        trigger: null,
        behaviors: [],
        tools: [],
        minutes: null,
        source: 'Home',
        note: note ?? null,
        flagged: false,
      });
    },
    [goodDayToday, addEntry, editEntry],
  );

  const addChange = useCallback(async (c: Omit<Change, 'id'>) => {
    const created = await db.insertChange(c);
    setChanges((prev) => [created, ...prev].sort((a, b) => b.start.localeCompare(a.start)));
  }, []);

  const editChange = useCallback(async (c: Change) => {
    await db.updateChange(c);
    setChanges((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  }, []);

  const removeChange = useCallback(async (id: string) => {
    await db.deleteChange(id);
    setChanges((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const stopMed = useCallback(async (id: string, end: string) => {
    await db.stopMedication(id, end);
    setChanges((prev) => prev.map((x) => (x.id === id ? { ...x, end } : x)));
  }, []);

  const changeDose = useCallback(
    async (existing: Change, dose: string, when: string, note = '') => {
      await db.changeDose(existing, dose, when, note);
      setChanges(await db.listChanges());
    },
    [],
  );

  const setDraft = useCallback((d: Draft | null) => {
    setDraftState(d);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      if (d) void db.saveDraft(d);
      else void db.clearDraft();
    }, DRAFT_DEBOUNCE_MS);
  }, []);

  const discardDraft = useCallback(async () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    setDraftState(null);
    await db.clearDraft();
  }, []);

  const restore = useCallback(
    async (raw: unknown) => {
      await db.restoreBackup(raw);
      await reload();
    },
    [reload],
  );

  const eraseAll = useCallback(async () => {
    await db.eraseEverything();
    await reload();
  }, [reload]);

  const value = useMemo<AppStateValue>(
    () => ({
      ready,
      settings,
      entries,
      changes,
      draft,
      theme,
      palette,
      saveSettings,
      addEntry,
      editEntry,
      removeEntry,
      markGoodDay,
      goodDayToday,
      episodesToday,
      addChange,
      editChange,
      removeChange,
      stopMed,
      changeDose,
      setDraft,
      discardDraft,
      restore,
      eraseAll,
      reload,
    }),
    [
      ready,
      settings,
      entries,
      changes,
      draft,
      theme,
      palette,
      saveSettings,
      addEntry,
      editEntry,
      removeEntry,
      markGoodDay,
      goodDayToday,
      episodesToday,
      addChange,
      editChange,
      removeChange,
      stopMed,
      changeDose,
      setDraft,
      discardDraft,
      restore,
      eraseAll,
      reload,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}

export function usePalette(): Palette {
  return useApp().palette;
}
