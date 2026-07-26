/**
 * The analysis engine. Everything on the doctor page and the sitter page comes
 * from here.
 *
 * Two rules are enforced structurally rather than by convention:
 *
 * 1. Days are distinct calendar dates, never row counts (PRODUCT.md rule 3).
 *    Every day figure below goes through distinctDays().
 *
 * 2. Nothing here computes or exposes causation (PRODUCT.md rule 7). Triggers
 *    are counted as "what comes before" and the caller is given the sample
 *    size so it can say so honestly. There is deliberately no correlation, no
 *    regression, and no "most likely cause" anywhere in this file, and none
 *    should be added.
 */

import { dateKey, distinctDays, MS_PER_DAY } from './dates';
import { Change, Entry, isNothingHelped, Stage } from './types';

/** Below this many episodes, the pages must say so in plain language. */
export const LOW_CONFIDENCE_THRESHOLD = 20;

/** A strategy needs at least this many uses before it outranks a one-off. */
export const MIN_USES_FOR_RANK = 2;

/** A before/after comparison needs this many episodes on EACH side. */
export const MIN_PER_SIDE_FOR_COMPARISON = 3;

export interface Counted {
  name: string;
  n: number;
  /** share of episodes, 0 to 1. Frequency, never a cause. */
  share: number;
}

export interface Help {
  name: string;
  n: number;
  /** median minutes to baseline when this was used */
  median: number;
  /** true when n === 1, so the UI can label it "(used once)" and rank it below */
  usedOnce: boolean;
}

export interface Analysis {
  /** episode count. An event count, not a day count. */
  episodes: number;
  goodEntries: number;
  totalEntries: number;

  /** distinct calendar dates with at least one episode */
  hardDays: number;
  /** distinct calendar dates marked good */
  goodDays: number;
  /** distinct calendar dates with any entry at all. The denominator. */
  allDays: number;
  /** dates that are marked good AND contain an episode. Both can be true. */
  bothDays: number;
  /** dates with an entry but no episode */
  clearDays: number;

  topTriggers: Counted[];
  topBehaviors: Counted[];
  sources: Counted[];
  /** stage number to count */
  stages: Record<Stage, number>;
  caughtEarly: number;

  helps: Help[];
  /** episodes where nothing tried helped */
  nothingHelped: number;

  /** the five longest episodes, longest first */
  longest: Entry[];
  flagged: Entry[];

  /** median minutes to baseline across all episodes */
  typical: number;
  /** episodes per week across the logged span */
  perWeek: number;
  /** calendar span covered, in days */
  spanDays: number;

  /** true when there are too few episodes to say much. Pages must disclose. */
  lowConfidence: boolean;
}

export function median(values: number[]): number {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v)).sort((a, b) => a - b);
  if (nums.length === 0) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? Math.round((nums[mid - 1] + nums[mid]) / 2) : nums[mid];
}

export function episodesOnly(entries: Entry[]): Entry[] {
  return entries.filter((e) => e.kind === 'episode');
}

export function goodOnly(entries: Entry[]): Entry[] {
  return entries.filter((e) => e.kind === 'good');
}

function rank(counts: Record<string, number>, denominator: number): Counted[] {
  return Object.keys(counts)
    .map((name) => ({
      name,
      n: counts[name],
      share: denominator > 0 ? counts[name] / denominator : 0,
    }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

export function analyse(entries: Entry[]): Analysis {
  const eps = episodesOnly(entries);
  const good = goodOnly(entries);

  const trig: Record<string, number> = {};
  const beh: Record<string, number> = {};
  const src: Record<string, number> = {};
  const stages: Record<Stage, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const toolMinutes: Record<string, number[]> = {};

  for (const e of eps) {
    if (e.trigger) trig[e.trigger] = (trig[e.trigger] ?? 0) + 1;
    const source = e.source || 'Home';
    src[source] = (src[source] ?? 0) + 1;
    const stage = (e.stage ?? 4) as Stage;
    stages[stage] = (stages[stage] ?? 0) + 1;

    for (const b of e.behaviors) beh[b] = (beh[b] ?? 0) + 1;

    for (const t of e.tools) {
      // "nothing we tried helped" is not a strategy and must never be ranked
      // among things that help.
      if (isNothingHelped(t)) continue;
      (toolMinutes[t] ??= []).push(e.minutes ?? 0);
    }
  }

  const helps: Help[] = Object.keys(toolMinutes)
    .map((name) => {
      const mins = toolMinutes[name];
      return { name, n: mins.length, median: median(mins), usedOnce: mins.length === 1 };
    })
    // Anything used at least twice outranks anything used once, regardless of
    // how good the one-off looked. A single fast recovery is not evidence.
    .sort((a, b) => {
      const aWeak = a.n < MIN_USES_FOR_RANK;
      const bWeak = b.n < MIN_USES_FOR_RANK;
      if (aWeak !== bWeak) return aWeak ? 1 : -1;
      return a.median - b.median || b.n - a.n;
    });

  const nothingHelped = eps.filter((e) => e.tools.some(isNothingHelped)).length;
  const caughtEarly = eps.filter((e) => e.stage === 1).length;

  // Days are days. An episode is an event, several can share one date, and a
  // date can be marked good even when something happened in it.
  const hardKeys = new Set(eps.map((e) => dateKey(e.at)));
  const goodKeys = new Set(good.map((e) => dateKey(e.at)));
  const allKeys = new Set([...hardKeys, ...goodKeys]);

  const hardDays = hardKeys.size;
  const goodDays = goodKeys.size;
  const allDays = allKeys.size;
  const bothDays = [...goodKeys].filter((k) => hardKeys.has(k)).length;
  const clearDays = allDays - hardDays;

  let spanDays = 0;
  let perWeek = 0;
  if (entries.length > 0) {
    const times = entries.map((e) => new Date(e.at).getTime());
    spanDays = Math.max(1, (Math.max(...times) - Math.min(...times)) / MS_PER_DAY);
    perWeek = eps.length / (spanDays / 7);
  }

  return {
    episodes: eps.length,
    goodEntries: good.length,
    totalEntries: entries.length,
    hardDays,
    goodDays,
    allDays,
    bothDays,
    clearDays,
    topTriggers: rank(trig, eps.length),
    topBehaviors: rank(beh, eps.length),
    sources: rank(src, eps.length),
    stages,
    caughtEarly,
    helps,
    nothingHelped,
    longest: [...eps].sort((a, b) => (b.minutes ?? 0) - (a.minutes ?? 0)).slice(0, 5),
    flagged: eps.filter((e) => e.flagged),
    typical: median(eps.map((e) => e.minutes ?? 0)),
    perWeek,
    spanDays: Math.round(spanDays),
    lowConfidence: eps.length < LOW_CONFIDENCE_THRESHOLD,
  };
}

export function entriesBetween(entries: Entry[], fromMs: number, toMs: number): Entry[] {
  return entries.filter((e) => {
    const t = new Date(e.at).getTime();
    return t >= fromMs && t < toMs;
  });
}

export interface Comparison {
  before: Analysis;
  after: Analysis;
  windowDays: number;
  afterDays: number;
  /**
   * False when either side has fewer than MIN_PER_SIDE_FOR_COMPARISON
   * episodes. The UI must show nothing numeric when this is false.
   */
  showable: boolean;
}

/**
 * A windowed before/after comparison around a change.
 *
 * Deliberately independent of every other change, so overlapping medications
 * cannot truncate each other. Do not reintroduce "until the next change"
 * logic here; that is the bug described in PRODUCT.md rule 8.
 *
 * Every caller must also surface the caveat that other things changed in the
 * same window, including how consistently the parent logged.
 */
export function compareChange(
  entries: Entry[],
  change: Change,
  windowDays = 30,
  now: number = Date.now(),
): Comparison {
  const w = windowDays * MS_PER_DAY;
  const at = new Date(change.start).getTime();
  const afterEnd = Math.min(at + w, now + 1);

  const before = analyse(entriesBetween(entries, at - w, at));
  const after = analyse(entriesBetween(entries, at, afterEnd));

  return {
    before,
    after,
    windowDays,
    afterDays: Math.round((afterEnd - at) / MS_PER_DAY),
    showable:
      before.episodes >= MIN_PER_SIDE_FOR_COMPARISON && after.episodes >= MIN_PER_SIDE_FOR_COMPARISON,
  };
}

export function percentChange(before: number, after: number): number | null {
  if (!before) return null;
  return Math.round(((after - before) / before) * 100);
}

/** Medications currently being given. Open ended records only. */
export function currentMeds(changes: Change[]): Change[] {
  return changes
    .filter((c) => c.kind === 'med' && !c.end)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Medications that have been stopped. */
export function pastMeds(changes: Change[]): Change[] {
  return changes
    .filter((c) => c.kind === 'med' && c.end)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
}

export function sortedChanges(changes: Change[]): Change[] {
  return [...changes].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
}

/** Entries in the trailing window, for the log summary strip. */
export function lastNDays(entries: Entry[], n: number, now: number = Date.now()): Entry[] {
  return entriesBetween(entries, now - n * MS_PER_DAY, now + 1);
}

export { distinctDays };
