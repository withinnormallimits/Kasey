/**
 * Date handling.
 *
 * The single most important thing in this file is dateKey(). Days are counted
 * as distinct calendar dates, never as row counts. Counting rows once produced
 * a denominator larger than the number of days that existed, on a page handed
 * to a psychiatrist. That bug shipped. See PRODUCT.md rule 3.
 *
 * The second most important thing is that dateKey() reads LOCAL calendar
 * fields and never toISOString(). toISOString() converts to UTC, so an episode
 * logged at 9pm in a UTC-05:00 timezone would land on the following calendar
 * date and silently split one day into two. That is the same class of bug
 * wearing a different hat.
 */

const MS_PER_DAY = 86_400_000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * The local calendar date of an instant, as YYYY-MM-DD.
 * This is the identity of a "day" everywhere in the app.
 */
export function dateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Distinct calendar dates in a list of instants. The correct day denominator. */
export function distinctDays(instants: Array<Date | string>): number {
  const seen = new Set<string>();
  for (const i of instants) seen.add(dateKey(i));
  return seen.size;
}

/** ISO 8601 local time, preserving the offset. Never a UTC Z string. */
export function toLocalISO(d: Date): string {
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

export function nowISO(): string {
  return toLocalISO(new Date());
}

/** Midnight at the start of the given day, in local time. */
export function startOfDay(d: Date | string): Date {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Whole calendar days between two instants, ignoring time of day.
 * Uses local midnights so daylight saving transitions cannot produce 0.96 of
 * a day and round to the wrong number.
 */
export function calendarDaysBetween(a: Date | string, b: Date | string): number {
  const from = startOfDay(a).getTime();
  const to = startOfDay(b).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

export function daysSince(iso: string): number {
  return Math.max(0, calendarDaysBetween(iso, new Date()));
}

/** "Today", "Yesterday", else a written date. */
export function relativeDayLabel(iso: string, now: Date = new Date()): string {
  const diff = calendarDaysBetween(iso, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = new Date(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** 12 hour clock, no leading zero, lowercase meridiem. */
export function timeLabel(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const mer = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${pad(m)}${mer}`;
}

export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Minutes rendered the way a parent would say them. */
export function minutesLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return h === 1 ? '1 hr' : `${h} hrs`;
  return `${h}h ${m}m`;
}

export { MS_PER_DAY };
