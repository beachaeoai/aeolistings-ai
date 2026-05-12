# Quote system v2 — CRM-driven creation (stub spec)

**Status:** Not started. Stub captured 2026-05-12 to keep the idea alive past Sprint 5.
**Prerequisites:** Sprints 5–7 of the intake system (`client-intake-v1.0.md` §10) shipped.
**Owner:** Jake Beach.

---

## 1. Why this exists

The v1 quote system (currently in production at `aeolistings.ai/quote/<slug>`) is hand-edited markdown:

- Author a file at `src/content/quotes/<business-slug>-<random-token>.md`
- Fill YAML frontmatter per `src/content.config.ts` schema
- Commit + push to `main`; Cloudflare Workers Builds redeploys the site
- Quote URL goes live; quote-events worker (`workers/quote-events/`) tracks views + handles accept

This works fine at 1–3 quotes/month. It does **not** scale to:

- Opportunities created from outbound prospecting tools (no automatic quote on stage change)
- Quote variants per prospect that share 80% scope but vary by industry / contract terms
- Sales-team handoffs without git commit access
- Real-time quote-status visibility from a CRM dashboard

Sprint 4 (intake form) + PR #16 (quote-accept → intake auto-mint) closed the funnel from quote acceptance forward. **The remaining manual choke point is quote creation itself.**

---

## 2. The shape of v2

CRM is the system of record for opportunity stage. When stage = "Quote Sent" (or equivalent), v2 generates a fresh quote page in seconds without manual file-editing or git operations.

### Three architectural patterns to choose between

| Pattern | Mechanism | Pros | Cons |
|---|---|---|---|
| **A — CRM → Worker → GitHub commit** | Worker generates markdown frontmatter, commits via GitHub API, site rebuilds | Reuses entire v1 stack; no schema changes | Rebuild latency 1–2 min between webhook and URL ready; GitHub API auth surface |
| **B — CRM → Worker → D1 row → dynamic route** | New `aeolistings.ai/q/<id>` route reads from D1; existing markdown route stays as legacy | Instant URLs; quotes editable post-creation; cleaner upgrade path to admin UI | 2–3 days work: new Astro route, D1 schema, migration tooling |
| **C — CRM is source of truth, site queries CRM** | Site fetches quote data from CRM API at render time | Zero sync drift; single source of truth | Site availability tied to CRM availability; vendor lock-in; harder caching |

**Default recommendation: Pattern B.** It's the right long-term answer — turns the quote system into a real product with an obvious admin-UI upgrade path. Pattern A is a stepping stone if v2 needs to ship before B's investment is justified.

### CRM choice — open

Stack constraints (Cloudflare Workers, Notion engagements, Resend, GitHub):

- **HubSpot** — free tier generous, robust webhooks on deal stage, big community. Best fit if scale grows past 30 opportunities.
- **Pipedrive** — built specifically for pipeline-by-stage workflows; paid from day one.
- **Close** — best for outbound + cold-call workflows. Wrong shape if Aeolistings stays inbound.
- **Attio** — modern, developer-friendly API, opinionated data model.
- **Folk** — lightweight, relationship-first. Limited automation primitives.
- **Notion-as-CRM** — already paid for + integrated with engagements; stage-change automation is clunky but workable.

**No commitment yet.** Decision deferred until one or two more client cycles have happened, so this can be picked from felt experience rather than abstractly.

---

## 3. Open decisions before this can be implemented

1. **Which CRM?** Pick after Sprint 5 ships and a few more clients have onboarded.
2. **Pattern A or B?** Recommend B; revisit if quote volume stays low after Sprint 5.
3. **Service template / pricing rules.** v1 has line items per client; v2 needs a re-usable template (e.g. "Foundation package", "Authority package", "AEO-only retainer") that the CRM can pick from + customize. Define these as a config file or a D1 table.
4. **Variant strategy.** Same client may need two quotes (e.g. Pattern A: with social management vs. without). v2 should support multiple active quotes per opportunity without ID collisions.
5. **Quote expiry handling.** v1's `validUntil` is decorative. v2 should grey out expired quotes server-side + send the opportunity a refresh email.
6. **Authorship audit trail.** When auto-generated, who's listed as `preparedBy`? Default to the CRM owner field; fall back to `Jake Beach`.
7. **Admin UI for editing.** Pattern B unlocks this. Decide whether to ship a minimal admin-edit form (Astro page protected by HMAC magic link, same pattern as intake) in the same sprint as v2 or defer to v2.1.

---

## 4. Touchpoints already in place

These don't need to change for v2 — they're the contract v2 has to honor:

- **`src/content.config.ts:quotes` schema** — fields v2 must populate, regardless of storage backend. Treat this as the canonical shape until v2 explicitly diverges.
- **`workers/quote-events/`** — view + accept tracking is storage-agnostic. v2 just needs to keep posting the same accept-event payload shape so the auto-mint-intake wiring (PR #16) keeps working.
- **`src/lib/quote.ts`** — totals computation. Refactor for v2 only if Pattern B introduces server-side computation; otherwise leave alone.
- **Intake auto-mint flow (PR #16, post-Sprint-4)** — quote acceptance → `POST /intake/api/intake/create`. v2 quotes must continue producing the same scope-flag mapping the worker reads from `selectedItems[].id`:

  | Quote line-item `id` | Intake `scope_flags` key |
  |---|---|
  | `website` | `website` |
  | `gbp` | `gbp` |
  | `social-setup` | `social_foundation` |
  | `social-management` | `social_management` |
  | `aeo-retainer` | `retainer` |

  Adding a new scope category in v2 requires updating `workers/quote-events/src/index.ts:SCOPE_FLAG_MAP` and `intake/src/lib/step-state.ts:CREDENTIAL_CATEGORIES` (the `scope` field on each category).

---

## 5. Sprint sequence when this is picked up

1. **Spec finalization** — turn this stub into a v1.0-style spec like `client-intake-v1.0.md`. Pick CRM + pattern. ~1–2 days.
2. **Build (Pattern B path)** — D1 schema, new Astro route, admin UI for editing, CRM webhook worker. ~5–7 days.
3. **Migrate existing markdown quotes** — read each markdown file, write to D1, redirect old URLs to new. Optional — markdown route can keep working indefinitely. ~0.5–1 day.
4. **CRM integration** — webhook receiver worker, scope-template mapping, stage-driven creation. ~2–3 days.

Total: ~2 weeks for one engineer, end-to-end.

---

## 6. What NOT to do

- **Don't build this in parallel with intake Sprint 5.** Two open architectural fronts at once = both ship slower. Sprint 5 first.
- **Don't pick a CRM without a real client need.** Premature CRM picks ossify into bad fit. Wait until friction is felt.
- **Don't break the v1 markdown flow until v2 is proven.** Markdown quotes can keep working indefinitely; v2 is additive.

---

## 7. Related specs

- [`client-intake-v1.0.md`](./client-intake-v1.0.md) — intake system v1 (the funnel below quote acceptance)
- [`notion-master-template-content.md`](./notion-master-template-content.md) — Notion template Sprint 5 will use post-submit

---

*This is a stub — not a contract. Re-read after Sprint 5 ships and one or two more client cycles complete.*
