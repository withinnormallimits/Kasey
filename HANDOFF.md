# Start here

**Read this first. It brings you fully up to speed on Kasey in about five minutes.**

Written for whoever picks this up next, human or AI, technical or not. The technical parts are marked so you can skip them.

---

## What Kasey is

An app for parents of autistic and neurodivergent children.

**The problem:** parenting an autistic child is high-stress day to day, and there are too many things happening to hold all of it in your head. Triggers, what worked last time, how long the last meltdown lasted, what the doctor said. It is a memory problem caused by exhaustion, not a discipline problem.

**What the app does:** you log a hard moment *after* it is over, in under a minute, mostly by tapping. The app then builds the pages you hand to other people — a one-pager for a sitter or teacher, and a factual summary for the doctor. You never write those pages yourself. They rebuild from your entries, so they are never out of date.

**The name:** Kasey, from K.C., for Keep Calm. That origin gets mentioned once quietly and never turned into marketing.

**The tagline:** *Because you can't hold it all.*

---

## Where it came from

It started as an idea saved into Notion, then got researched, red-teamed, named, designed, and built as a working prototype. Along the way it was checked against what parents actually say in forums, what competing apps get wrong, mobile design research, accessibility standards, and the concerns of autistic adults about tracking apps.

Roughly in this order:
1. The idea and the "why" behind it
2. Research into what already exists and what people actually need
3. Naming and the logo
4. A working prototype
5. A full market research pass
6. Changes based on what that research found

**All of that reasoning lives in the Notion page.** This repo is the buildable version of it.

---

## Where everything lives

| Thing | Where | What it holds |
| --- | --- | --- |
| **Notion page** | Idea Vault → App Ideas → Kasey | The complete thinking history: research, naming, logo spec, red team, market analysis, the change list |
| **This repo** | GitHub | The documents needed to build it, plus the working prototype |
| **The prototype** | `prototype/kasey-prototype.html` | A complete working app in one file. Open it in any browser. |

**If you do one thing before reading anything else: open the prototype and use it for five minutes.** Load the example entries from Setup. That is the product, and it will explain more than any document here.

---

## Current state

- ✅ The prototype works end to end and has been through several rounds of bug-hunting
- ✅ Name, tagline, logo, and colour system are decided and verified
- ✅ Market research is done
- ❌ **Not built yet: the ability to actually send someone a page.** This is the gap that matters. The whole idea is handoff documents, and right now there is no way to hand one to anybody.
- ❌ Not built: backup and restore, so a lost phone would lose everything
- ❌ Not built: the real mobile app. The prototype is a browser page, not something in an app store.

---

## The rules that must not drift

These came from research or from bugs that already happened. Full detail with reasons is in `docs/PRODUCT.md`.

- **Logging happens after things calm down**, never during a meltdown.
- **Under 60 seconds per entry.** Everything else is negotiable. This one is not.
- **Good days get logged too.** A record made only of meltdowns makes any child look worse than they are.
- **No streaks and no guilt.** Missing a day is fine and the app never implies otherwise.
- **The sitter page opens with who the child is** — what they love, what they are proud of, what makes them laugh — before anything about triggers.
- **Never claim something caused something.** The app shows how often things happen. It never says why.
- **Never use** the words tracker, tantrum, behaviour, manage, or the puzzle piece symbol. These get products publicly torn apart by autistic adults, for reasons worth understanding rather than just avoiding.
- **The data stays on the device.** No accounts, no cloud, no analytics. That is a legal and trust decision, not laziness.

---

## What happens next

In order. Full detail in `docs/ROADMAP.md`.

1. Scaffold the real mobile app *(technical)*
2. Port the prototype screen by screen *(technical)*
3. **Build sharing.** Turn a page into a PDF and send it. This is the one that makes the product real.
4. Get it onto five real parents' phones through TestFlight

Before any public launch: have two or three autistic adults read the wording, and get trademark and app store name checks done. Neither has happened.

---

## Working on this with Claude

**Claude accounts do not share memory or projects.** Starting fresh on a different account means nothing carries over automatically. To get a new Claude current:

1. Create a Project in Claude
2. Paste the contents of `docs/CLAUDE-PROJECT-INSTRUCTIONS.md` into the Project's custom instructions
3. Upload this file, `docs/PRODUCT.md`, `docs/SPEC.md`, `docs/ROADMAP.md`, and the prototype HTML into the Project's knowledge
4. Share the Notion page

For writing actual code, use Claude Code in the repo instead. It reads `CLAUDE.md` automatically at the start of every session.

---

## The honest summary

The idea is sound and the research supports it. The best-known competitor shut down and the rest are weak. The design choices are unusually careful and several of them are things nobody else does.

The two things most likely to kill it: people stop logging after a few weeks, or the wording offends the community it is meant to serve.

Both are addressable. Neither is addressed yet.
