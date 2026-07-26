# Kasey

**Because you can't hold it all.**

A retrospective log for parents of autistic and neurodivergent children that auto-generates a shareable one-pager for doctors, teachers, and sitters.

## Start here

**New to this project? Read `HANDOFF.md` first.** It is the full catch-up in about five minutes, written for technical and non-technical readers alike.

1. Open `prototype/kasey-prototype.html` in a browser. Use it for five minutes. That is the product.
2. Read `CLAUDE.md`, then `docs/PRODUCT.md`.
3. Follow `docs/ROADMAP.md` from M0.

## What this repo is

| Path | What it is |
| --- | --- |
| `HANDOFF.md` | The catch-up document. Start here if you are new, or transferring this to someone else. |
| `docs/CLAUDE-PROJECT-INSTRUCTIONS.md` | Paste into a fresh Claude account to bring it up to speed. |
| `prototype/` | A complete working build in one HTML file. The reference implementation and the spec of last resort. |
| `CLAUDE.md` | Project memory. Claude Code reads this at the start of every session. |
| `docs/PRODUCT.md` | Decisions that must not drift. Read before changing behavior. |
| `docs/SPEC.md` | Data model, screens, generated output, design tokens. |
| `docs/ROADMAP.md` | Build order, one session per milestone. |

## Stack

React Native + Expo, TypeScript, SQLite via expo-sqlite. Local-first. No accounts, no backend.

## The one thing

If you only remember one rule: **an episode entry must stay under 60 seconds on a phone.** Everything else is negotiable.
