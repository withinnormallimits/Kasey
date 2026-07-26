# Spec

The prototype at `prototype/kasey-prototype.html` is the reference implementation. Open it in a browser and use it. Where this document and the prototype disagree, **the prototype wins** and this document should be corrected.

---

## Data model

SQLite via `expo-sqlite`. All timestamps ISO 8601 strings in local time.

### `entries`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT PK | |
| `at` | TEXT | ISO. The moment it happened, not the moment it was logged |
| `kind` | TEXT | `episode` or `good` |
| `stage` | INTEGER | 1 to 4. Required for `episode`, null for `good` |
| `trigger` | TEXT | single value from the parent's own list |
| `behaviors` | TEXT | JSON array, optional |
| `tools` | TEXT | JSON array. "Nothing we tried helped" is exclusive |
| `minutes` | INTEGER | minutes to baseline. Required for `episode` |
| `source` | TEXT | Home / School / Sitter / Therapy / Out |
| `note` | TEXT | optional, one line, always editable |
| `flagged` | INTEGER | 0/1, raise this one with the doctor |
| `created_at` | TEXT | audit |
| `updated_at` | TEXT | audit, null until first edit |

### `changes`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT PK | |
| `kind` | TEXT | `med` / `therapy` / `school` / `other` |
| `label` | TEXT | drug name or short description |
| `dose` | TEXT | free text, e.g. "10mg twice daily". Med only |
| `start` | TEXT | ISO date |
| `end` | TEXT | ISO date or null. **Records overlap. Never infer an end from the next record.** |
| `note` | TEXT | why it changed |

### `settings`
Single row. `child_name`, `child_age`, `contact`, `loves`, `proud_of`, `laughs`, `always_true`, `communication`, `please_dont`, `worth_knowing`, `theme`, `onboarded`, plus JSON libraries for triggers / behaviors / tools / sources.

### `draft`
One row, nullable. The in-progress entry, written on a 400ms debounce. **Losing work is the single biggest source of frustrated user language in mobile forms** and mobile form abandonment runs around 81%.

---

## Screens

### First run — onboarding
Six steps, skippable, rerunnable from Setup. Welcome, then four questions (name, what they love, what they are proud of, what makes them laugh), then a live preview of the generated page and a button into it.

**The point is a real, printable page in about 40 seconds with zero episodes logged.** Time-to-first-value is the retention lever.

### Log
- Bottom bar: **Good day** (one tap) and **Something happened** (opens the form).
- The Good day button relabels by state: `Good day` → `Still a good day` (an episode exists today) → `Day marked good` (tap to edit the note).
- Summary card: last 30 days, days with an episode, typical recovery, caught early, and a labeled ratio bar.
- Entries grouped by day. **The verdict renders above that day's episodes, indented beneath it.** The nesting states the relationship.
- This week expanded, older months collapsed.
- Tap an entry → read-only detail with Edit and Delete. Never tap straight into a form.

### Entry form
Order matters. Stage first because it is one tap and requires no typing.
1. How far did it get (4 stages)
2. What set it off (chips, parent-extensible)
3. Back to baseline (slider + quick presets)
4. What helped (chips, multi, "Nothing we tried helped" exclusive)
5. Behind "Add more detail": when, where, what it looked like, note, flag for doctor

Save lives in a fixed bottom bar. Draft autosaves. Closing a dirty new entry confirms first.

After saving a new episode, ask once: **"How was the rest of the day?"** → *Fine, actually* / *Rough too*. This is the moment the parent actually knows, and it teaches the two-concept model by doing.

### Pages
Segmented: **Sitters** / **Doctor** / **Changes**. Bottom bar holds Print, or Log a change on the Changes segment.

### Read
Long-form articles. Static content. Not a growth lever, do not over-invest.

### Setup
Identity, the four strengths fields, always-true traits, communication, please-don't, worth-knowing, theme, data export, rerun onboarding, erase.

---

## Generated output

### Sitter page
Masthead → **Start here** (loves / proud of / laughs) → always true → how it usually goes (the four stages with counts and an intervention note) → what comes before → what helps, fastest first → current medication with "you are not being asked to give any medication" → please don't → how they communicate → worth knowing → footnote.

### Doctor page
Masthead → at a glance (days logged, days with an episode, days marked good, episodes recorded, frequency per week, median to baseline, de-escalated at stage 1, longest, nothing helped, last 30 vs prior 30) → escalation reached → recorded antecedents with percentages → observed behaviors → interventions with sample sizes and medians → by setting → current medication → medication history → other changes → flagged to raise → longest episodes → caregiver notes → footnote.

The footnote is load-bearing. It states the data is caregiver-reported, unverified, that antecedents are observations rather than causes, and how days are counted.

### Changes
Current medications with dose and duration, actions to change dose or mark stopped. Past medications. Then per change: a 30 day before / after comparison of frequency, duration, and caught-early rate, with a **minimum of 3 episodes on each side** before anything is shown.

---

## Design tokens

Two themes, both verified against WCAG AA. Nothing outside `src/theme/tokens.ts` hardcodes a color.

Light: paper `#F1F3EF`, card `#FFFFFF`, ink `#16201F`, muted `#5E6D69`, accent `#2C574B`, interactive border `#7C8A84`.
Dark: base `#151A19` (never pure black), card `#1E2524`, ink `#E4EAE7`, muted `#97A5A1`, accent `#6FC2A3` with dark text on top, border `#6E7B77`.

Recovery ramp, single hue, varies by lightness:
`#BBD2C7 → #8FB5A5 → #639784 → #3E7864 → #25584A` (light)
`#2F5346 → #3E7864 → #559A80 → #74BC9C → #9BD9BC` (dark)

Warm accent is rationed to two states only: "nothing we tried helped" and a stage 4 meltdown.

**The generated pages stay white paper in both themes.** They print, and a clinical document should look like a document.

Type: Fraunces 600 (wordmark), Newsreader (display), Public Sans (UI), IBM Plex Mono (data).

Logo spec including gradients and the small-size variant is in the Notion page, section 8. Gradients must use `userSpaceOnUse` — `objectBoundingBox` drops any path with a zero-width bounding box, which silently deleted the stem of the K once.
