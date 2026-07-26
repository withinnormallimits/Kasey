/**
 * Generated handoff documents.
 *
 * These build from settings plus entries and are never written by hand, so
 * they cannot go stale. The same HTML feeds the on screen preview and the PDF
 * that gets shared, so what a parent proofreads is exactly what a teacher
 * receives.
 *
 * The pages stay white paper in both themes. They print, and a document handed
 * to a psychiatrist should look like a document.
 *
 * Rules enforced here:
 * - The sitter page opens with who the child is, before any trigger.
 * - No causal language anywhere. "What comes before", never "what causes".
 * - Below 20 episodes the pages say so in plain language.
 * - A strategy used once is labeled and ranked below ones with real evidence.
 * - The footnote is load bearing. It is not decoration and must not be cut.
 * - No em dashes or en dashes in any user facing copy.
 */

import { Analysis, analyse, currentMeds, pastMeds } from '../domain/analyse';
import { calendarDaysBetween, daysSince, minutesLabel, relativeDayLabel } from '../domain/dates';
import { Change, Entry, Settings, STAGES, Stage } from '../domain/types';
import { paperDoc } from '../theme/tokens';

export type PageKind = 'sitter' | 'doctor';

/** Escapes user entered text. Everything a parent typed goes through this. */
export function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function childName(s: Settings): string {
  return s.childName.trim() || 'Your child';
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** "3 of 12 times" reads more honestly to a clinician than a bare percentage. */
function outOf(n: number, total: number): string {
  return `${n} of ${total}`;
}

const FONT_STACK = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const MONO_STACK = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

function styles(): string {
  return `
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 28px 26px 34px;
    background: ${paperDoc.bg}; color: ${paperDoc.ink};
    font-family: ${FONT_STACK};
    font-size: 14px; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .head { padding-bottom: 15px; border-bottom: 2px solid ${paperDoc.ink}; margin-bottom: 20px; }
  .head h1 { font-size: 26px; font-weight: 600; margin: 0 0 3px; letter-spacing: -0.01em; }
  .head .who { font-size: 13px; color: ${paperDoc.ink2}; }
  .head .gen { font-family: ${MONO_STACK}; font-size: 10.5px; color: ${paperDoc.ink3}; margin-top: 9px; line-height: 1.7; }
  .block { margin-bottom: 21px; }
  .block h2 {
    font-family: ${MONO_STACK}; font-size: 10.5px; letter-spacing: 0.14em;
    text-transform: uppercase; color: ${paperDoc.deep}; margin: 0 0 9px; font-weight: 600;
  }
  .block.warn h2 { color: ${paperDoc.warn}; }
  .hero { background: ${paperDoc.goodSoft}; border-radius: 10px; padding: 16px 17px; margin: 0 0 21px; }
  .hero h2 { color: ${paperDoc.onGoodSoft}; }
  .hero p { color: ${paperDoc.onGoodSoft}; margin: 0 0 6px; font-size: 14.5px; }
  .hero p:last-child { margin-bottom: 0; }
  .hero .k { font-weight: 600; }
  p.prose { margin: 0; color: ${paperDoc.ink2}; white-space: pre-wrap; }
  ul.list { list-style: none; margin: 0; padding: 0; }
  ul.list li {
    display: flex; justify-content: space-between; gap: 14px; align-items: baseline;
    padding: 6px 0; border-bottom: 1px dotted ${paperDoc.line};
  }
  ul.list li:last-child { border-bottom: none; }
  ul.list .val { font-family: ${MONO_STACK}; font-size: 11.5px; color: ${paperDoc.ink3}; flex: none; white-space: nowrap; }
  ul.list .val.good { color: ${paperDoc.deep}; font-weight: 600; }
  .once { font-style: italic; color: ${paperDoc.ink3}; font-size: 12.5px; }
  .stage { display: flex; gap: 11px; padding: 9px 0; border-bottom: 1px dotted ${paperDoc.line}; align-items: flex-start; }
  .stage:last-child { border-bottom: none; }
  .stage .n { font-family: ${MONO_STACK}; font-size: 11px; font-weight: 600; color: ${paperDoc.deep}; flex: none; width: 14px; padding-top: 2px; }
  .stage .nm { font-weight: 600; display: block; }
  .stage .ds { font-size: 13px; color: ${paperDoc.ink2}; display: block; margin-top: 1px; }
  .stage .ct { margin-left: auto; font-family: ${MONO_STACK}; font-size: 11px; color: ${paperDoc.ink3}; flex: none; padding-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 6px 0; border-bottom: 1px dotted ${paperDoc.line}; vertical-align: top; }
  td:last-child { text-align: right; font-family: ${MONO_STACK}; font-size: 11.5px; color: ${paperDoc.ink3}; white-space: nowrap; padding-left: 12px; }
  tr:last-child td { border-bottom: none; }
  .note { font-size: 12.5px; color: ${paperDoc.ink3}; line-height: 1.6; margin: 8px 0 0; }
  .callout {
    border: 1px solid ${paperDoc.line}; border-radius: 8px; padding: 12px 13px;
    font-size: 13px; color: ${paperDoc.ink2}; margin: 0 0 21px;
  }
  .foot {
    margin-top: 24px; padding-top: 12px; border-top: 1px solid ${paperDoc.line};
    font-family: ${MONO_STACK}; font-size: 10px; color: ${paperDoc.ink3}; line-height: 1.7;
  }
  .empty { color: ${paperDoc.ink3}; font-style: italic; }
  @page { margin: 14mm; }
  @media print { body { padding: 0; } }
  `;
}

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${styles()}</style>
</head><body>${bodyHtml}</body></html>`;
}

function generatedStamp(): string {
  const d = new Date();
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ------------------------------------------------------------------ *
 * The footnote. Load bearing on both pages.
 * ------------------------------------------------------------------ */

function footnote(a: Analysis, kind: PageKind): string {
  const lines = [
    `Generated by Kasey on ${generatedStamp()} from ${a.totalEntries} entries recorded by a parent or caregiver.`,
    `This information is caregiver reported and has not been clinically verified.`,
    `Entries are written down after the moment has passed, not as it happens, so times are recalled rather than measured.`,
    `Items under "what comes before" are things that were noticed beforehand. They are observations, not causes.`,
    `Days are counted as distinct calendar dates. Several episodes can occur on one date, and a date can be marked good even when something happened in it.`,
  ];
  if (kind === 'doctor' && a.lowConfidence) {
    lines.push(
      `This summary covers ${a.episodes} episodes, which is a small number. Treat any pattern here as provisional.`,
    );
  }
  return `<div class="foot">${lines.map((l) => esc(l)).join('<br>')}</div>`;
}

/* ------------------------------------------------------------------ *
 * Sitter page
 *
 * Structure mirrors the person centred one page profile format used in UK
 * SEND practice: who they are, what matters to them, how to support them.
 * Strengths lead. A page that opens with "loves trains" reads as care. One
 * that opens with "top triggers" reads as management.
 * ------------------------------------------------------------------ */

export function sitterPageHtml(settings: Settings, entries: Entry[], changes: Change[]): string {
  const s = settings;
  const name = childName(s);
  const a = analyse(entries);
  const meds = currentMeds(changes);
  const blocks: string[] = [];

  blocks.push(`<div class="head">
    <h1>${esc(name)}${s.childAge ? `, ${esc(s.childAge)}` : ''}</h1>
    <div class="who">For teachers, sitters, and anyone caring for ${esc(name)}</div>
    <div class="gen">${esc(`Prepared ${generatedStamp()}`)}${
      s.contact ? `<br>${esc(`If you need us: ${s.contact}`)}` : ''
    }</div>
  </div>`);

  // Start here. Always first, even when nothing has been logged.
  const strengths: string[] = [];
  if (s.loves) strengths.push(`<p><span class="k">Loves:</span> ${esc(s.loves)}</p>`);
  if (s.proudOf) strengths.push(`<p><span class="k">Proud of:</span> ${esc(s.proudOf)}</p>`);
  if (s.laughs) strengths.push(`<p><span class="k">Makes them laugh:</span> ${esc(s.laughs)}</p>`);
  blocks.push(`<div class="hero">
    <h2>Start here</h2>
    ${
      strengths.length
        ? strengths.join('')
        : `<p>Add a few lines in Setup and they will appear here.</p>`
    }
  </div>`);

  if (s.alwaysTrue) {
    blocks.push(
      `<div class="block"><h2>Always true</h2><p class="prose">${esc(s.alwaysTrue)}</p></div>`,
    );
  }

  // How it usually goes. Stages with counts, so a sitter knows what "coming
  // back from it" looks like rather than only what the worst looks like.
  if (a.episodes > 0) {
    const rows = STAGES.map((st) => {
      const n = a.stages[st.n as Stage] ?? 0;
      return `<div class="stage">
        <span class="n">${st.n}</span>
        <span class="b"><span class="nm">${esc(st.name)}</span><span class="ds">${esc(st.ds)}</span></span>
        <span class="ct">${n} ${n === 1 ? 'time' : 'times'}</span>
      </div>`;
    }).join('');
    const early =
      a.caughtEarly > 0
        ? `<p class="note">${esc(
            `${outOf(a.caughtEarly, a.episodes)} times, it was caught early and did not take hold. Stepping in at the first sign is worth trying.`,
          )}</p>`
        : '';
    blocks.push(`<div class="block"><h2>How it usually goes</h2>${rows}${early}</div>`);
  }

  if (a.topTriggers.length) {
    const items = a.topTriggers
      .slice(0, 6)
      .map(
        (t) =>
          `<li><span>${esc(t.name)}</span><span class="val">${esc(
            outOf(t.n, a.episodes),
          )}</span></li>`,
      )
      .join('');
    blocks.push(`<div class="block">
      <h2>What comes before</h2>
      <ul class="list">${items}</ul>
      <p class="note">${esc(
        'These are things that were noticed beforehand. They are not causes, and they will not always be there.',
      )}</p>
    </div>`);
  }

  if (a.helps.length) {
    const items = a.helps
      .slice(0, 6)
      .map(
        (h) =>
          `<li><span>${esc(h.name)}${
            h.usedOnce ? ' <span class="once">(used once)</span>' : ''
          }</span><span class="val${h.usedOnce ? '' : ' good'}">${esc(
            `usually settles in ${minutesLabel(h.median)}`,
          )}</span></li>`,
      )
      .join('');
    blocks.push(`<div class="block">
      <h2>What helps, fastest first</h2>
      <ul class="list">${items}</ul>
      ${
        a.nothingHelped > 0
          ? `<p class="note">${esc(
              `${outOf(a.nothingHelped, a.episodes)} times nothing we tried helped. That happens, and it is not a sign you did it wrong. Keeping them safe and waiting it out is enough.`,
            )}</p>`
          : ''
      }
    </div>`);
  }

  if (meds.length) {
    const items = meds
      .map(
        (m) =>
          `<li><span>${esc(m.label)}</span><span class="val">${esc(m.dose || 'current')}</span></li>`,
      )
      .join('');
    blocks.push(`<div class="block">
      <h2>Current medication</h2>
      <ul class="list">${items}</ul>
      <p class="note">${esc(
        'This is listed so you know what they take. You are not being asked to give any medication.',
      )}</p>
    </div>`);
  }

  if (s.pleaseDont) {
    blocks.push(
      `<div class="block warn"><h2>Please don't</h2><p class="prose">${esc(s.pleaseDont)}</p></div>`,
    );
  }
  if (s.communication) {
    blocks.push(
      `<div class="block"><h2>How they communicate</h2><p class="prose">${esc(
        s.communication,
      )}</p></div>`,
    );
  }
  if (s.worthKnowing) {
    blocks.push(
      `<div class="block"><h2>Worth knowing</h2><p class="prose">${esc(s.worthKnowing)}</p></div>`,
    );
  }

  blocks.push(footnote(a, 'sitter'));
  return shell(`${name} - for sitters and teachers`, blocks.join(''));
}

/* ------------------------------------------------------------------ *
 * Doctor page
 *
 * A clinician has minutes, not an afternoon. Research on patient generated
 * health data is consistent that raw logs get ignored and pre synthesised
 * summaries get read. So this leads with a headline and an explicit "what
 * changed" delta, then groups rather than listing chronologically.
 * ------------------------------------------------------------------ */

export function doctorPageHtml(settings: Settings, entries: Entry[], changes: Change[]): string {
  const s = settings;
  const name = childName(s);
  const a = analyse(entries);
  const blocks: string[] = [];

  const now = Date.now();
  const DAY = 86_400_000;
  const recent = entries.filter((e) => new Date(e.at).getTime() >= now - 30 * DAY);
  const prior = entries.filter((e) => {
    const t = new Date(e.at).getTime();
    return t >= now - 60 * DAY && t < now - 30 * DAY;
  });
  const aRecent = analyse(recent);
  const aPrior = analyse(prior);

  blocks.push(`<div class="head">
    <h1>${esc(name)}${s.childAge ? `, ${esc(s.childAge)}` : ''}</h1>
    <div class="who">Caregiver recorded summary</div>
    <div class="gen">${esc(
      `Prepared ${generatedStamp()} - covering ${a.allDays} logged ${
        a.allDays === 1 ? 'day' : 'days'
      }, ${a.episodes} ${a.episodes === 1 ? 'episode' : 'episodes'}`,
    )}</div>
  </div>`);

  if (a.lowConfidence) {
    blocks.push(`<div class="callout">${esc(
      `This covers ${a.episodes} ${
        a.episodes === 1 ? 'episode' : 'episodes'
      }, which is a small number to draw anything from. The figures below are what was recorded, not a pattern we can stand behind yet.`,
    )}</div>`);
  }

  // What changed. The one thing every source says clinicians want and rarely get.
  if (aPrior.episodes > 0 || aRecent.episodes > 0) {
    const rows: string[] = [
      `<tr><td>Episodes recorded</td><td>${aPrior.episodes} then ${aRecent.episodes} now</td></tr>`,
      `<tr><td>Days with an episode</td><td>${aPrior.hardDays} then ${aRecent.hardDays} now</td></tr>`,
      `<tr><td>Median time back to baseline</td><td>${
        aPrior.episodes ? minutesLabel(aPrior.typical) : 'no data'
      } then ${aRecent.episodes ? minutesLabel(aRecent.typical) : 'no data'}</td></tr>`,
      `<tr><td>Caught at stage 1</td><td>${aPrior.caughtEarly} then ${aRecent.caughtEarly}</td></tr>`,
    ];
    blocks.push(`<div class="block">
      <h2>What changed, last 30 days against the 30 before</h2>
      <table>${rows.join('')}</table>
      <p class="note">${esc(
        'Other things changed in the same window too, including how consistently this was logged. Read this as a description of the record, not as an effect.',
      )}</p>
    </div>`);
  }

  const glance: Array<[string, string]> = [
    ['Days logged', String(a.allDays)],
    ['Days with an episode', String(a.hardDays)],
    ['Days marked good', String(a.goodDays)],
    ['Days both good and hard', String(a.bothDays)],
    ['Episodes recorded', String(a.episodes)],
    ['Episodes per week', a.spanDays > 0 ? a.perWeek.toFixed(1) : 'not enough span'],
    ['Median time back to baseline', a.episodes ? minutesLabel(a.typical) : 'no data'],
    ['Caught at stage 1', `${a.caughtEarly} of ${a.episodes}`],
    ['Nothing tried helped', `${a.nothingHelped} of ${a.episodes}`],
  ];
  blocks.push(`<div class="block">
    <h2>At a glance</h2>
    <table>${glance.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
  </div>`);

  if (a.episodes > 0) {
    const rows = STAGES.map((st) => {
      const n = a.stages[st.n as Stage] ?? 0;
      return `<tr><td>${esc(`${st.n}. ${st.name}`)}</td><td>${esc(
        `${n} (${pct(a.episodes ? n / a.episodes : 0)})`,
      )}</td></tr>`;
    }).join('');
    blocks.push(`<div class="block"><h2>Escalation reached</h2><table>${rows}</table></div>`);
  }

  if (a.topTriggers.length) {
    const rows = a.topTriggers
      .map(
        (t) =>
          `<tr><td>${esc(t.name)}</td><td>${esc(`${outOf(t.n, a.episodes)} (${pct(t.share)})`)}</td></tr>`,
      )
      .join('');
    blocks.push(`<div class="block">
      <h2>Recorded antecedents</h2>
      <table>${rows}</table>
      <p class="note">${esc(
        'These are what the caregiver noticed beforehand. They are observations, not causes, and no causal inference should be drawn from these frequencies.',
      )}</p>
    </div>`);
  }

  if (a.topBehaviors.length) {
    const rows = a.topBehaviors
      .map((b) => `<tr><td>${esc(b.name)}</td><td>${esc(outOf(b.n, a.episodes))}</td></tr>`)
      .join('');
    blocks.push(`<div class="block"><h2>What was observed</h2><table>${rows}</table></div>`);
  }

  if (a.helps.length) {
    const rows = a.helps
      .map(
        (h) =>
          `<tr><td>${esc(h.name)}${
            h.usedOnce ? ' <span class="once">(used once)</span>' : ''
          }</td><td>${esc(
            `n=${h.n}, median ${minutesLabel(h.median)}`,
          )}</td></tr>`,
      )
      .join('');
    blocks.push(`<div class="block">
      <h2>Interventions tried</h2>
      <table>${rows}</table>
      <p class="note">${esc(
        'Median time to baseline when each was used. Sample sizes are small and these were not tried under comparable conditions.',
      )}</p>
    </div>`);
  }

  if (a.sources.length) {
    const rows = a.sources
      .map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(`${outOf(x.n, a.episodes)} (${pct(x.share)})`)}</td></tr>`)
      .join('');
    blocks.push(`<div class="block"><h2>By setting</h2><table>${rows}</table></div>`);
  }

  const meds = currentMeds(changes);
  if (meds.length) {
    const rows = meds
      .map(
        (m) =>
          `<tr><td>${esc(m.label)}${m.dose ? esc(`, ${m.dose}`) : ''}</td><td>${esc(
            `since ${relativeDayLabel(m.start)}, ${daysSince(m.start)} days`,
          )}</td></tr>`,
      )
      .join('');
    blocks.push(`<div class="block"><h2>Current medication</h2><table>${rows}</table></div>`);
  }

  const past = pastMeds(changes);
  if (past.length) {
    const rows = past
      .map(
        (m) =>
          `<tr><td>${esc(m.label)}${m.dose ? esc(`, ${m.dose}`) : ''}</td><td>${esc(
            `${m.start} to ${m.end ?? 'unknown'}`,
          )}</td></tr>`,
      )
      .join('');
    blocks.push(`<div class="block"><h2>Medication history</h2><table>${rows}</table></div>`);
  }

  const others = changes.filter((c) => c.kind !== 'med');
  if (others.length) {
    const rows = others
      .map((c) => `<tr><td>${esc(c.label)}</td><td>${esc(`from ${c.start}`)}</td></tr>`)
      .join('');
    blocks.push(`<div class="block"><h2>Other changes</h2><table>${rows}</table></div>`);
  }

  if (a.flagged.length) {
    const rows = a.flagged
      .map(
        (e) =>
          `<tr><td>${esc(e.trigger || 'Something happened')}${
            e.note ? esc(`. ${e.note}`) : ''
          }</td><td>${esc(relativeDayLabel(e.at))}</td></tr>`,
      )
      .join('');
    blocks.push(`<div class="block warn"><h2>Flagged to raise</h2><table>${rows}</table></div>`);
  }

  if (a.longest.length) {
    const rows = a.longest
      .map(
        (e) =>
          `<tr><td>${esc(e.trigger || 'Something happened')}${
            e.source ? esc(`, ${e.source}`) : ''
          }</td><td>${esc(`${minutesLabel(e.minutes ?? 0)}, ${relativeDayLabel(e.at)}`)}</td></tr>`,
      )
      .join('');
    blocks.push(`<div class="block"><h2>Longest episodes</h2><table>${rows}</table></div>`);
  }

  const notes = entries.filter((e) => e.note && e.note.trim()).slice(0, 12);
  if (notes.length) {
    const rows = notes
      .map((e) => `<tr><td>${esc(e.note ?? '')}</td><td>${esc(relativeDayLabel(e.at))}</td></tr>`)
      .join('');
    blocks.push(`<div class="block"><h2>Caregiver notes</h2><table>${rows}</table></div>`);
  }

  blocks.push(footnote(a, 'doctor'));
  return shell(`${name} - summary`, blocks.join(''));
}

export function pageHtml(
  kind: PageKind,
  settings: Settings,
  entries: Entry[],
  changes: Change[],
): string {
  return kind === 'sitter'
    ? sitterPageHtml(settings, entries, changes)
    : doctorPageHtml(settings, entries, changes);
}

export function pageFileName(kind: PageKind, settings: Settings): string {
  const base = (settings.childName.trim() || 'kasey').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `${base}-${kind === 'sitter' ? 'for-sitters' : 'summary'}-${stamp}.pdf`;
}

export { calendarDaysBetween };
