# Decision log

Append here whenever a choice gets made that a future session would otherwise relitigate. Newest at the top.

Format: date, decision, why, and what it rules out.

---

## 2026-07-26 — The summary strip is a retention requirement, not decoration
Research on this category is consistent that the generated report cannot be the only payoff. Median 70% of users discontinue within 100 days, 53% of mood-tracking users stop inside 7 days, and a report by definition needs accumulated data. An app that gives nothing back until there is "enough" dies before its flagship feature ever runs. The last-30-days strip on the log is the cheap, always-current answer to "was any of this worth it".
Rules out: removing the strip to simplify the log, or gating any feedback behind a minimum number of entries.

## 2026-07-26 — Entries are labeled as recalled, not measured
The ecological momentary assessment literature finds retrospective logging less accurate than real-time logging. We cannot ask a parent to log mid-meltdown, so retrospective is correct, but the generated pages must not imply clinical precision they do not have. The footnote states that entries are written after the moment has passed.
Rules out: presenting durations as measured, or any language implying continuous monitoring.

## 2026-07-26 — `kind` is stored as `episode`, not `hard`
docs/SPEC.md specifies `episode` or `good`, and PRODUCT.md rule 3 defines an episode. The prototype stores the legacy string "hard" and carries a migrate() to paper over its own history. This is a fresh database with nothing to migrate, so it uses the vocabulary the spec and the product rules use.
Rules out: reintroducing "hard" as a stored value. It stays a prototype artifact.

## 2026-07-26 — Web is a development target, not a shipping target
react-native-web plus a WASM SQLite build lets the app be built and reviewed in a desktop browser without a phone. This is for iteration speed only.
Rules out: treating web as a supported platform, and treating a browser as sufficient verification. The 60 second rule can only be measured on a phone with a thumb, and the share sheet does not exist in a browser at all. M1 and M7 in particular must be verified on a real device before they count as done.

## 2026-07-26 — Prototype frozen as the reference build
The single-file HTML app in `prototype/` is feature-complete for v1 scope and has been through several rounds of red-teaming. It is the spec of last resort.
Rules out: relitigating schema, screen order, or copy without a reason that is not "I would have done it differently".

## 2026-07-26 — Sharing is the gating feature
The product cannot do the thing it is named for until a parent can put a page in a teacher's hands. Everything after M7 is optimization on a promise that is not yet kept.
Rules out: shipping to real users before M7.

## 2026-07-26 — Local-first, no accounts, v1
Keeps us outside HIPAA and the FTC Health Breach Notification Rule, and small teams cannot sustain backend infrastructure. The category leader, Birdhouse for Autism, shut down citing exactly this.
Rules out: cloud sync, multi-caregiver live editing, and web accounts until there is a reason bigger than convenience.
Cost accepted: device loss equals data loss, which is why backup and restore is a requirement rather than a feature.
