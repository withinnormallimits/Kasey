# Kasey

## WHY
An app for parents of autistic and neurodivergent children. The problem is forgetting under chronic stress. The value is retrospective capture plus **auto-generated handoff documents** for doctors, teachers, and sitters. Tagline: "Because you can't hold it all."

## WHAT
React Native + Expo, TypeScript, local-first SQLite. Single child. No accounts, no backend, no sync in v1.

## HOW
```bash
npm install
npx expo start          # dev, scan QR with Expo Go
npx tsc --noEmit        # typecheck before every commit
npm test                # jest
```

## Project layout
- `prototype/kasey-prototype.html` — **the working reference build.** Open it in a browser. When a spec question comes up, the prototype is the answer.
- `docs/PRODUCT.md` — non-negotiable product rules. Read before changing behavior.
- `docs/SPEC.md` — data model, screens, generated output.
- `docs/ROADMAP.md` — build order, one session per milestone.

## Always
- Read `docs/PRODUCT.md` before changing any user-facing text or behavior.
- Keep an episode entry under 60 seconds on a phone. If a change adds a field, say so explicitly and justify it.
- Every touch target ≥ 48px. Primary actions in the bottom third of the screen.
- Verify color contrast against WCAG AA (4.5:1 text, 3:1 UI) before committing a palette change.
- Never encode meaning in color alone.
- Store dates as ISO strings. Count days as distinct calendar dates, never as row counts.

## Never
- Never use: "tracker", "tantrum", "behavior" (as a noun for the child), "manage", "challenging behaviors", "dysregulation", or the puzzle piece symbol.
- Never claim causation. Show frequency and counts. "What comes before", not "what causes".
- Never use `window.confirm`, `alert`, or `prompt`.
- Never add streaks, guilt mechanics, or daily nagging notifications.
- Never add cloud sync, accounts, or analytics without an explicit decision recorded in `docs/PRODUCT.md` — it changes our HIPAA and FTC posture.
- Never use em dashes or en dashes in user-facing copy.

## Conventions
- TypeScript strict. No `any`.
- Functional components, hooks. No class components.
- Colocate styles with components. Design tokens live in `src/theme/tokens.ts` and nothing hardcodes a hex value outside it.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
