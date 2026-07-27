# Roadmap

One milestone per Claude Code session. Each has a definition of done you can check yourself in five minutes. Do not start the next one until the current one runs on your actual phone.

**Rule for every session:** open the prototype next to you. When Claude asks how something should work, the answer is usually "like the prototype does".

---

## M0 — Scaffold
Get an empty app onto your phone. Nothing else.

```bash
npx create-expo-app@latest kasey --template blank-typescript
cd kasey && npx expo start
```

**Done when:** the default screen renders on your phone through Expo Go, and `npx tsc --noEmit` is clean.

**Do not** let Claude add navigation, state management, or a component library in this session.

---

## M1 — Data layer
SQLite schema from `docs/SPEC.md`, plus typed repository functions. No UI.

**Done when:** a throwaway test inserts an episode, a good day, and a medication, then reads them back with correct types. `analyse()` counts days as distinct dates. Write the day-counting test first — that bug shipped once already.

---

## M2 — The log
List, day grouping with the verdict above episodes, the two bottom buttons, one-tap good day with undo.

**Done when:** you can log a good day on your phone, force-quit, reopen, and it is still there.

---

## M3 — The entry form
Stage picker, chips, slider, progressive disclosure, autosaving draft, bottom save bar.

**Done when:** you log a real episode in under 60 seconds, and killing the app mid-entry then reopening restores the draft. **Time yourself. If it is over 60 seconds, cut a field before moving on.**

---

## M4 — Detail and edit
Read-only detail, edit, delete with an in-app confirm. Never a native modal.

**Done when:** you can correct yesterday's entry and the audit trail shows added and edited timestamps.

---

## M5 — The sitter page
Generated from settings plus entries. Strengths first.

**Done when:** with zero episodes logged but the four strengths filled in, a real page renders.

---

## M6 — Onboarding
Six steps ending on a live preview.

**Done when:** a fresh install produces a printable page in under a minute.

---

## M7 — Share and export
**The most important milestone in this document.** PDF generation plus the native share sheet.

```bash
npx expo install expo-print expo-sharing expo-file-system
```

**Done when:** you text the sitter page to someone and they open it as a PDF. Also: JSON backup out, JSON backup in, restoring onto a second device.

Until this ships, the app cannot do the thing it is named for.

---

## M8 — The doctor page
All the tables from the spec, including the footnote.

**Done when:** you would be willing to hand it to an actual psychiatrist.

---

## M9 — Medications and changes
Typed changes, overlapping medications, dose-change flow, before/after comparison with the 3-per-side minimum.

**Done when:** logging a second medication does not end the first one. Test this explicitly.

---

## M10 — Theme and accessibility
Tokens, light/dark/auto, contrast verification.

**Done when:** a script asserts every token pair meets AA and fails the build if not. Ask Claude to write that script — the math is in the prototype's history.

---

## M11 — Ship
Apple Developer ($99/yr) and Google Play ($25 once). Privacy policy. TestFlight and Play internal testing.

**Done when:** five real parents have it on their phones.

Register the developer accounts during M7, not here. Apple approval can take days to weeks.

---

## Not in v1
Moved to `docs/BACKLOG.md`, which is now the single place deferred work lives.

---

## Working with Claude Code

**Start each session by naming the milestone.** For example: "Read CLAUDE.md, docs/PRODUCT.md and docs/SPEC.md. We are on M3, the entry form. The prototype is in prototype/. Build it, then stop."

Useful habits:
- `/init` once at the start of the project to generate a first pass, then replace it with the CLAUDE.md in this repo.
- Ask for a plan before code on anything touching the data model.
- Commit at the end of every milestone with a conventional-commit message.
- When Claude proposes an extra field, ask what it costs in seconds. That is the real currency.
- If something feels off in the built app, check the prototype first. It is probably right there.

**Two things to be suspicious of:** any change that adds a step to logging, and any copy that starts explaining causation. Both are how this product gets worse.
