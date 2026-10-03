# Sentry — open items only

> Fixed history (May–Sep 2026 dumps, REQ-0010…0017, 0232–0239) lives in git. Do not re-paste resolved dashboards here.
> Root `SENTRY_ERRORS.md` is a gitignored live dump — not the tracked source of truth.

**Last update:** 2026-09-09  
**Gate 2:** PENDING (watch in progress) — `gate2-sentry-24h` / REQ-0009  
**Prod tip:** `3feceb7` Ready `dpl_CM4s3niMwoccbc1ny2yPWGESrzko` — local harden waves (typed URL lists + invoice fee lock + currency) **not yet deployed**

---

## Still open

| ID | Issue | Status | Next |
| ---- | -------- | -------- | ------ |
| OPEN-1 | Post-deploy Sentry quiet watch (24h) | **Watch in progress** | Do **not** APPROVE Gate 2 until ~24h quiet High/Error on deployed tip. Role smoke PASS (admin/client/supplier login + lists). `/api/monitoring` 429 = rate-limit noise (tunnel kept) |
| OPEN-2 | Hydration on `/` after currency fix | Observe | Replay if persists; no blanket scrub |
| OPEN-4 | Hooks-after-`removeChild` fallout | Leave | Existing scrub + ErrorBoundary |

---

## Closed this cycle (pointer only)

| REQ | What |
| ----- | ------ |
| 0232–0239 | Payments/fees/currency/scrub (shipped) |
| Harden W1–2 | Zod typed list URL `page`/`pageSize`/`q` + Products→catalog lists |
| Harden W3 | Monitoring 429 documented (no tunnel disable) |
| Harden W4 | Invoice fees order-authoritative; more `formatStableCurrency` UI |
| Earlier | Product 4xx→Sentry, translate/`removeChild`, ChunkLoad, OAuth warn — see git / CLAUDE.md |

**Verdict:** Harden code ready locally. Gate 2 still needs quiet Sentry evidence after deploy — not fake-closed.
