/**
 * Backdating.
 *
 * PRODUCT.md rule 1: logging is always retrospective, and backdating must be
 * exact, obvious, and always correctable.
 *
 * The risk these tests exist for: a backdated entry landing on the wrong
 * calendar date, or inflating the day counts. Days are distinct calendar
 * dates, and adding an entry to a date that already exists must not create a
 * second day.
 */

import { analyse } from '../analyse';
import { dateKey, fromDateAndTime, toDateInput, toLocalISO, toTimeInput } from '../dates';
import { Entry } from '../types';

let n = 0;
function episode(at: string, over: Partial<Entry> = {}): Entry {
  n += 1;
  return {
    id: `e${n}`,
    at,
    kind: 'episode',
    stage: 4,
    trigger: 'Loud noise',
    behaviors: [],
    tools: [],
    minutes: 20,
    source: 'Home',
    note: null,
    flagged: false,
    // logged now, regardless of when it happened
    created_at: '2026-03-10T22:00:00',
    updated_at: null,
    ...over,
  };
}

describe('the date and time inputs round trip exactly', () => {
  it('rebuilds the same local instant it displayed', () => {
    const original = new Date(2026, 2, 4, 21, 30, 0, 0);
    const rebuilt = fromDateAndTime(toDateInput(original), toTimeInput(original));

    expect(rebuilt).not.toBeNull();
    expect(rebuilt!.getFullYear()).toBe(2026);
    expect(rebuilt!.getMonth()).toBe(2);
    expect(rebuilt!.getDate()).toBe(4);
    expect(rebuilt!.getHours()).toBe(21);
    expect(rebuilt!.getMinutes()).toBe(30);
  });

  it('keeps the calendar date the parent picked, including late evening', () => {
    // 11:30pm is where a UTC conversion would roll the date forward
    const picked = fromDateAndTime('2026-03-04', '23:30');
    expect(picked).not.toBeNull();
    expect(dateKey(toLocalISO(picked!))).toBe('2026-03-04');
  });

  it('keeps the date across a month boundary', () => {
    const picked = fromDateAndTime('2026-02-28', '23:59');
    expect(dateKey(toLocalISO(picked!))).toBe('2026-02-28');
  });

  it('refuses an incomplete date rather than inventing a timestamp', () => {
    expect(fromDateAndTime('', '10:00')).toBeNull();
    expect(fromDateAndTime('2026-03', '10:00')).toBeNull();
    expect(fromDateAndTime('not-a-date', '10:00')).toBeNull();
  });

  it('defaults a missing time to midday rather than midnight', () => {
    // midnight would sit on the boundary between two calendar dates
    const d = fromDateAndTime('2026-03-04', '');
    expect(d!.getHours()).toBe(12);
    expect(dateKey(toLocalISO(d!))).toBe('2026-03-04');
  });
});

describe('a backdated entry lands on the day it happened', () => {
  it('groups by when it happened, not when it was logged', () => {
    const backdated = episode('2026-03-04T14:00:00', {
      created_at: '2026-03-10T22:00:00',
    });

    // the log groups on `at`
    expect(dateKey(backdated.at)).toBe('2026-03-04');
    // and the audit trail still shows the later logging date
    expect(dateKey(backdated.created_at)).toBe('2026-03-10');
    expect(dateKey(backdated.at)).not.toBe(dateKey(backdated.created_at));
  });
});

describe('backdating does not corrupt the day counts', () => {
  it('adding an entry to a date that already exists does not add a day', () => {
    const before = [episode('2026-03-04T09:00:00'), episode('2026-03-05T09:00:00')];
    expect(analyse(before).allDays).toBe(2);

    // parent remembers a second thing that happened on the 4th
    const after = [...before, episode('2026-03-04T19:00:00')];
    const a = analyse(after);

    expect(a.episodes).toBe(3);
    expect(a.allDays).toBe(2);
    expect(a.hardDays).toBe(2);
  });

  it('backdating onto a genuinely new date adds exactly one day', () => {
    const before = [episode('2026-03-04T09:00:00')];
    const after = [...before, episode('2026-03-01T09:00:00')];
    const a = analyse(after);

    expect(a.episodes).toBe(2);
    expect(a.allDays).toBe(2);
  });

  it('never lets day counts exceed the calendar dates present', () => {
    // five entries backdated across three dates
    const entries = [
      episode('2026-03-04T08:00:00'),
      episode('2026-03-04T13:00:00'),
      episode('2026-03-04T20:00:00'),
      episode('2026-03-06T10:00:00'),
      episode('2026-03-07T11:00:00'),
    ];
    const a = analyse(entries);

    expect(a.episodes).toBe(5);
    expect(a.allDays).toBe(3);
    expect(a.hardDays).toBeLessThanOrEqual(a.allDays);
  });

  it('correcting the date of an entry moves it, it does not duplicate it', () => {
    const original = episode('2026-03-04T09:00:00');
    expect(analyse([original]).allDays).toBe(1);

    // parent realises it was actually the 3rd
    const corrected: Entry = { ...original, at: '2026-03-03T09:00:00', updated_at: '2026-03-10T22:05:00' };
    const a = analyse([corrected]);

    expect(a.episodes).toBe(1);
    expect(a.allDays).toBe(1);
    expect(dateKey(corrected.at)).toBe('2026-03-03');
  });
});

describe('the audit trail stays honest', () => {
  it('separates when it happened from when it was logged', () => {
    const e = episode('2026-03-04T14:00:00', { created_at: '2026-03-10T22:00:00' });
    expect(new Date(e.created_at).getTime()).toBeGreaterThan(new Date(e.at).getTime());
  });

  it('an unedited entry has no edited timestamp', () => {
    expect(episode('2026-03-04T14:00:00').updated_at).toBeNull();
  });
});
