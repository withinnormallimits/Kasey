/**
 * These tests police the product rules that are easiest to break by accident
 * and most expensive when broken: banned vocabulary, causal claims, the
 * strengths-first ordering of the sitter page, and the footnote.
 *
 * A failure here is not a test problem. It means a page about to be handed to
 * a teacher or a psychiatrist says something it must not say.
 */

import { doctorPageHtml, esc, sitterPageHtml } from '../generate';
import { Change, Entry, Settings, NOTHING_HELPED, defaultSettings } from '../../domain/types';

const settings: Settings = {
  ...defaultSettings(),
  childName: 'Avi',
  childAge: '8',
  contact: 'Jen, 555 0100',
  loves: 'Trains, anything with a map, his dog Rocket',
  proudOf: 'Reading chapter books on his own',
  laughs: 'Silly voices and terrible knock-knock jokes',
  alwaysTrue: 'Needs to know what happens next.',
  communication: 'Talks a lot when calm. Goes quiet when overwhelmed.',
  pleaseDont: 'Do not rush him through transitions.',
  worthKnowing: 'He will ask the same question twice. That is him checking, not testing you.',
};

const DAY = 86_400_000;

/** ISO local timestamp N days before now, so the 30 and 60 day windows apply. */
function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(10, 0, 0, 0);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T10:00:00`;
}

let n = 0;
function episode(over: Partial<Entry> = {}): Entry {
  n += 1;
  const at = daysAgo((n % 25) + 1);
  return {
    id: `e${n}`,
    at,
    kind: 'episode',
    stage: 4,
    trigger: 'Loud noise',
    behaviors: ['Covering ears'],
    tools: ['Headphones'],
    minutes: 25,
    source: 'Home',
    note: null,
    flagged: false,
    created_at: at,
    updated_at: null,
    ...over,
  };
}

const changes: Change[] = [
  { id: 'c1', kind: 'med', label: 'Ritalin', dose: '10mg twice daily', start: '2026-01-10', end: null, note: '' },
  { id: 'c2', kind: 'med', label: 'Melatonin', dose: '3mg at bedtime', start: '2026-02-01', end: null, note: '' },
];

const someEntries = Array.from({ length: 8 }, (_, i) =>
  episode({ trigger: i % 2 === 0 ? 'Transition' : 'Loud noise', stage: i % 4 === 0 ? 1 : 4 }),
);

/** Every string a parent or a clinician will actually read. */
function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

const BANNED = [
  'tracker',
  'tantrum',
  'challenging behavior',
  'challenging behaviour',
  'problem behavior',
  'target behavior',
  'dysregulation',
  'puzzle',
  'high functioning',
  'low functioning',
];

/**
 * The pages are allowed to say the word "causes" only inside an explicit
 * denial. Strip the sanctioned denials first, then assert that no causal
 * language survives. Checking the bare word would pass forever once someone
 * deleted the disclaimer, which is precisely the regression that matters.
 */
const SANCTIONED_DENIALS = [
  'observations, not causes',
  'they are not causes',
  'no causal inference should be drawn',
];

const CAUSAL = [
  'causes',
  'caused by',
  'what causes',
  'because of',
  'leads to',
  'results in',
  'triggers a meltdown',
  'due to',
];

describe.each([
  ['sitter', sitterPageHtml],
  ['doctor', doctorPageHtml],
])('%s page language', (_kind, build) => {
  const html = build(settings, someEntries, changes);
  const text = visibleText(html).toLowerCase();

  it.each(BANNED)('never uses the word "%s"', (word) => {
    expect(text).not.toContain(word);
  });

  it('carries the sanctioned denial of causation', () => {
    // if this disappears, the check below stops meaning anything
    expect(text).toContain('observations, not causes');
  });

  it.each(CAUSAL)('never makes the causal claim "%s"', (phrase) => {
    let stripped = text;
    for (const d of SANCTIONED_DENIALS) stripped = stripped.split(d).join(' ');
    expect(stripped).not.toContain(phrase);
  });

  it('uses no em dashes or en dashes', () => {
    expect(visibleText(html)).not.toMatch(/[–—]/);
  });

  it('says the data is caregiver reported and unverified', () => {
    expect(text).toContain('caregiver');
    expect(text).toContain('not been clinically verified');
  });

  it('states how days are counted', () => {
    expect(text).toContain('distinct calendar dates');
  });

  it('says antecedents are observations rather than causes', () => {
    expect(text).toContain('observations, not causes');
  });

  it('discloses that entries are written after the fact', () => {
    expect(text).toContain('after the moment has passed');
  });
});

describe('sitter page leads with who the child is', () => {
  const html = sitterPageHtml(settings, someEntries, changes);
  const text = visibleText(html);

  it('puts strengths before anything about what comes before', () => {
    const startHere = text.indexOf('Start here');
    const comesBefore = text.indexOf('What comes before');
    expect(startHere).toBeGreaterThan(-1);
    expect(comesBefore).toBeGreaterThan(-1);
    expect(startHere).toBeLessThan(comesBefore);
  });

  it('puts what they love before any trigger name', () => {
    expect(text.indexOf('Trains')).toBeLessThan(text.indexOf('What comes before'));
  });

  it('renders a real page with zero episodes logged', () => {
    // Time to first value. The onboarding promise is a printable page in about
    // 40 seconds with nothing logged.
    const empty = sitterPageHtml(settings, [], []);
    const emptyText = visibleText(empty);
    expect(emptyText).toContain('Avi');
    expect(emptyText).toContain('Trains');
    expect(emptyText).toContain('Start here');
  });

  it('tells a sitter they are not being asked to give medication', () => {
    expect(text).toContain('not being asked to give any medication');
  });

  it('does not blame the parent when nothing helped', () => {
    const withNothing = sitterPageHtml(
      settings,
      [...someEntries, episode({ tools: [NOTHING_HELPED], minutes: 90 })],
      changes,
    );
    const t = visibleText(withNothing);
    expect(t).toContain('nothing we tried helped');
    expect(t).toContain('not a sign you did it wrong');
    // "nothing worked" reads like a verdict on the parent at 11pm
    expect(t.toLowerCase()).not.toContain('nothing worked');
  });
});

describe('doctor page honesty', () => {
  it('discloses a small sample in plain language', () => {
    const html = doctorPageHtml(settings, someEntries, changes);
    const text = visibleText(html);
    expect(text).toContain('small number');
  });

  it('drops the small sample warning once there is enough data', () => {
    const many = Array.from({ length: 25 }, () => episode());
    const text = visibleText(doctorPageHtml(settings, many, changes));
    expect(text).not.toContain('which is a small number to draw anything from');
  });

  it('labels a strategy used once and ranks it below real evidence', () => {
    const entries = [
      episode({ tools: ['Ride in car'], minutes: 2 }),
      episode({ tools: ['Headphones'], minutes: 25 }),
      episode({ tools: ['Headphones'], minutes: 35 }),
    ];
    const text = visibleText(doctorPageHtml(settings, entries, []));
    expect(text).toContain('(used once)');
    expect(text.indexOf('Headphones')).toBeLessThan(text.indexOf('Ride in car'));
  });

  it('lists overlapping medications as both current', () => {
    const text = visibleText(doctorPageHtml(settings, someEntries, changes));
    expect(text).toContain('Ritalin');
    expect(text).toContain('Melatonin');
    // neither may appear under medication history while both are open ended
    expect(text).not.toContain('Medication history');
  });

  it('carries the caveat on the before and after comparison', () => {
    const text = visibleText(doctorPageHtml(settings, someEntries, changes));
    expect(text).toContain('how consistently this was logged');
  });

  it('never reports more days than calendar dates that exist', () => {
    const sameDay = [
      episode({ at: '2026-03-04T08:00:00' }),
      episode({ at: '2026-03-04T12:00:00' }),
      episode({ at: '2026-03-04T18:00:00' }),
    ];
    const text = visibleText(doctorPageHtml(settings, sameDay, []));
    expect(text).toContain('Days logged 1');
    expect(text).toContain('Episodes recorded 3');
  });
});

describe('escaping', () => {
  it('escapes text a parent typed, so a stray angle bracket cannot break the page', () => {
    expect(esc('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapes child details into the rendered page', () => {
    const risky: Settings = { ...settings, loves: 'Trains & <maps>' };
    const html = sitterPageHtml(risky, [], []);
    expect(html).toContain('Trains &amp; &lt;maps&gt;');
    expect(html).not.toContain('<maps>');
  });
});
