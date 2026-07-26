/**
 * The day-counting tests exist because that bug shipped once, on a page handed
 * to a psychiatrist. Counting rows produced a denominator larger than the
 * number of days that existed. If any of these fail, do not "fix" the test.
 */

import {
  analyse,
  compareChange,
  currentMeds,
  median,
  MIN_PER_SIDE_FOR_COMPARISON,
  pastMeds,
  percentChange,
} from '../analyse';
import { dateKey, distinctDays } from '../dates';
import { Change, Entry, NOTHING_HELPED, Stage } from '../types';

let seq = 0;
function episode(at: string, over: Partial<Entry> = {}): Entry {
  seq += 1;
  return {
    id: `e${seq}`,
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
    created_at: at,
    updated_at: null,
    ...over,
  };
}

function goodDay(at: string, over: Partial<Entry> = {}): Entry {
  seq += 1;
  return {
    id: `g${seq}`,
    at,
    kind: 'good',
    stage: null,
    trigger: null,
    behaviors: [],
    tools: [],
    minutes: null,
    source: 'Home',
    note: null,
    flagged: false,
    created_at: at,
    updated_at: null,
    ...over,
  };
}

describe('days are distinct calendar dates, never row counts', () => {
  it('counts three episodes in one day as one day', () => {
    const entries = [
      episode('2026-03-04T09:00:00'),
      episode('2026-03-04T13:30:00'),
      episode('2026-03-04T19:45:00'),
    ];
    const a = analyse(entries);

    expect(a.episodes).toBe(3);
    expect(a.hardDays).toBe(1);
    expect(a.allDays).toBe(1);
  });

  it('never lets the day denominator exceed the days that exist', () => {
    // Two calendar dates, seven rows. This is the exact shape of the bug.
    const entries = [
      episode('2026-03-04T08:00:00'),
      episode('2026-03-04T10:00:00'),
      episode('2026-03-04T12:00:00'),
      goodDay('2026-03-04T21:00:00'),
      episode('2026-03-05T09:00:00'),
      episode('2026-03-05T15:00:00'),
      goodDay('2026-03-05T21:00:00'),
    ];
    const a = analyse(entries);

    expect(a.allDays).toBe(2);
    expect(a.hardDays).toBeLessThanOrEqual(a.allDays);
    expect(a.goodDays).toBeLessThanOrEqual(a.allDays);
    expect(a.episodes).toBe(5);
    expect(a.episodes).toBeGreaterThan(a.allDays);
  });

  it('lets a day be both good and contain an episode', () => {
    const entries = [episode('2026-03-04T11:00:00'), goodDay('2026-03-04T21:00:00')];
    const a = analyse(entries);

    expect(a.hardDays).toBe(1);
    expect(a.goodDays).toBe(1);
    expect(a.bothDays).toBe(1);
    expect(a.allDays).toBe(1);
    // a rough half hour does not cancel a decent day
    expect(a.clearDays).toBe(0);
  });

  it('counts a good day with no episode as a clear day', () => {
    const entries = [goodDay('2026-03-04T21:00:00'), episode('2026-03-05T10:00:00')];
    const a = analyse(entries);

    expect(a.allDays).toBe(2);
    expect(a.hardDays).toBe(1);
    expect(a.clearDays).toBe(1);
  });

  it('does not shift a late evening entry onto the next date', () => {
    // toISOString() would move 11:30pm in a negative UTC offset onto tomorrow
    // and split one day into two.
    const entries = [episode('2026-03-04T23:30:00'), episode('2026-03-04T23:59:00')];
    expect(analyse(entries).allDays).toBe(1);
  });

  it('distinctDays agrees with the analysis', () => {
    const stamps = ['2026-03-04T01:00:00', '2026-03-04T23:00:00', '2026-03-05T12:00:00'];
    expect(distinctDays(stamps)).toBe(2);
    expect(dateKey('2026-03-04T23:00:00')).toBe('2026-03-04');
  });
});

describe('what helps', () => {
  it('never ranks "nothing we tried helped" as a strategy', () => {
    const entries = [
      episode('2026-03-01T10:00:00', { tools: [NOTHING_HELPED], minutes: 90 }),
      episode('2026-03-02T10:00:00', { tools: ['Headphones'], minutes: 10 }),
    ];
    const a = analyse(entries);

    expect(a.helps.map((h) => h.name)).toEqual(['Headphones']);
    expect(a.nothingHelped).toBe(1);
  });

  it('ranks anything used twice above anything used once', () => {
    const entries = [
      // used once, looks spectacular
      episode('2026-03-01T10:00:00', { tools: ['Ride in car'], minutes: 2 }),
      // used twice, looks worse, but is actual evidence
      episode('2026-03-02T10:00:00', { tools: ['Headphones'], minutes: 25 }),
      episode('2026-03-03T10:00:00', { tools: ['Headphones'], minutes: 35 }),
    ];
    const a = analyse(entries);

    expect(a.helps[0].name).toBe('Headphones');
    expect(a.helps[0].usedOnce).toBe(false);
    expect(a.helps[1].name).toBe('Ride in car');
    expect(a.helps[1].usedOnce).toBe(true);
  });

  it('reports a median, not a mean, so one long episode cannot dominate', () => {
    const entries = [
      episode('2026-03-01T10:00:00', { tools: ['Snack'], minutes: 10 }),
      episode('2026-03-02T10:00:00', { tools: ['Snack'], minutes: 10 }),
      episode('2026-03-03T10:00:00', { tools: ['Snack'], minutes: 240 }),
    ];
    expect(analyse(entries).helps[0].median).toBe(10);
  });
});

describe('honesty guards', () => {
  it('flags low confidence below 20 episodes', () => {
    const few = Array.from({ length: 19 }, (_, i) =>
      episode(`2026-03-${String(i + 1).padStart(2, '0')}T10:00:00`),
    );
    expect(analyse(few).lowConfidence).toBe(true);

    const enough = Array.from({ length: 20 }, (_, i) =>
      episode(`2026-03-${String(i + 1).padStart(2, '0')}T10:00:00`),
    );
    expect(analyse(enough).lowConfidence).toBe(false);
  });

  it('reports triggers as frequency shares, not causes', () => {
    const entries = [
      episode('2026-03-01T10:00:00', { trigger: 'Transition' }),
      episode('2026-03-02T10:00:00', { trigger: 'Transition' }),
      episode('2026-03-03T10:00:00', { trigger: 'Hungry' }),
    ];
    const a = analyse(entries);

    expect(a.topTriggers[0]).toMatchObject({ name: 'Transition', n: 2 });
    expect(a.topTriggers[0].share).toBeCloseTo(2 / 3);
    // there is no cause, likelihood, or correlation field to read
    expect(Object.keys(a.topTriggers[0])).toEqual(['name', 'n', 'share']);
  });
});

describe('stages', () => {
  it('counts caught-early separately, because it is the win condition', () => {
    const entries = [
      episode('2026-03-01T10:00:00', { stage: 1 }),
      episode('2026-03-02T10:00:00', { stage: 1 }),
      episode('2026-03-03T10:00:00', { stage: 4 }),
    ];
    const a = analyse(entries);

    expect(a.caughtEarly).toBe(2);
    expect(a.stages[1 as Stage]).toBe(2);
    expect(a.stages[4 as Stage]).toBe(1);
  });
});

describe('medications overlap', () => {
  const ritalin: Change = {
    id: 'c1',
    kind: 'med',
    label: 'Ritalin',
    dose: '10mg twice daily',
    start: '2026-01-10',
    end: null,
    note: '',
  };
  const melatonin: Change = {
    id: 'c2',
    kind: 'med',
    label: 'Melatonin',
    dose: '3mg at bedtime',
    start: '2026-02-01',
    end: null,
    note: '',
  };

  it('does not end one medication when another starts', () => {
    const meds = currentMeds([ritalin, melatonin]);

    expect(meds.map((m) => m.label)).toEqual(['Ritalin', 'Melatonin']);
    expect(meds.every((m) => m.end === null)).toBe(true);
    expect(pastMeds([ritalin, melatonin])).toHaveLength(0);
  });

  it('compares a change against its own window, independent of other changes', () => {
    const entries = [
      episode('2026-01-05T10:00:00'),
      episode('2026-01-06T10:00:00'),
      episode('2026-01-07T10:00:00'),
      episode('2026-01-12T10:00:00'),
      episode('2026-01-13T10:00:00'),
      episode('2026-01-14T10:00:00'),
    ];
    const cmp = compareChange(entries, ritalin, 30, new Date('2026-02-20').getTime());

    expect(cmp.before.episodes).toBe(3);
    expect(cmp.after.episodes).toBe(3);
    expect(cmp.showable).toBe(true);
  });

  it('refuses to show a comparison with too few episodes on a side', () => {
    const entries = [
      episode('2026-01-05T10:00:00'),
      episode('2026-01-12T10:00:00'),
      episode('2026-01-13T10:00:00'),
      episode('2026-01-14T10:00:00'),
    ];
    const cmp = compareChange(entries, ritalin, 30, new Date('2026-02-20').getTime());

    expect(cmp.before.episodes).toBeLessThan(MIN_PER_SIDE_FOR_COMPARISON);
    expect(cmp.showable).toBe(false);
  });
});

describe('helpers', () => {
  it('median handles even and odd counts and an empty list', () => {
    expect(median([])).toBe(0);
    expect(median([5])).toBe(5);
    expect(median([10, 20])).toBe(15);
    expect(median([30, 10, 20])).toBe(20);
  });

  it('percentChange guards against a zero baseline', () => {
    expect(percentChange(0, 5)).toBeNull();
    expect(percentChange(10, 5)).toBe(-50);
  });

  it('an empty log produces zeroes, not NaN', () => {
    const a = analyse([]);
    expect(a.episodes).toBe(0);
    expect(a.allDays).toBe(0);
    expect(a.typical).toBe(0);
    expect(a.perWeek).toBe(0);
    expect(Number.isNaN(a.perWeek)).toBe(false);
  });
});
