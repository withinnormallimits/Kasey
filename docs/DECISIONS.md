# Decision log

Append here whenever a choice gets made that a future session would otherwise relitigate. Newest at the top.

Format: date, decision, why, and what it rules out.

---

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
