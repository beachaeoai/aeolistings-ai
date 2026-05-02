---
name: visibility-audit
description: Run a full Aeolistings-branded visibility audit on a local service business — site analysis, three real competitors, GBP analysis, AEO readiness, scope of services, and three deliverable PDFs (full report, one-pager, GBP supplement). Use when a new client needs a baseline audit, when an existing engagement starts, or when the user types "/audit [URL]" or "audit https://..." in conversation. Orchestrates the research → synthesis → PDF-build pipeline.
---

# Visibility audit — full pipeline

## When this lands

A new prospect, an existing client kicking off, or a "tell me how this site is doing" request with a URL. Output is three branded PDFs that match the Aeolistings editorial design language and live in `audit-output/`.

## The 4-stage pipeline

### Stage 1 — Research (parallel)

**Spawn two background agents in parallel:**

1. **`local-search-auditor` agent** — analyzes the target site and runs the GBP inspection
2. **`competitor-researcher` agent** — finds 3 real direct competitors, runs same analysis on each

Both should run in the background simultaneously since they're independent. Wait for both to return before proceeding.

While the agents run, the main agent can:
- Read any existing client memory (e.g., `~/.claude/projects/.../memory/client_X.md`)
- Examine the project's `src/content/quotes/` for any existing quote data on this client
- Check the brand-exports directory for the wordmark

### Stage 2 — Synthesize (foreground)

Once both research streams return, the main agent synthesizes:

- **The 7-dimension scorecard:** Local positioning · Service depth · Service area clarity · FAQ/answers · Trust & proof · AEO readiness · Findability — score 1–5 for target + each competitor
- **The strengths-vs-gaps diverging assessment:** what's working in oxblood, what's holding back visibility in dark ink, weighted 1–10
- **The 90-day roadmap:** phased actions tied to real timelines (highest priority 0–30d, near-term 30–90d, foundational ongoing, optional polish)
- **The 12 key gaps:** ranked High / Medium / Foundational with one-sentence "why it matters"
- **The 16-item priority checklist:** grouped by phase, tagged SEO / AEO / Both
- **The scope of services:** typically 4–6 one-time line items + AEO retainer, mapped to specific audit findings, with founding-client discount math

### Stage 3 — Build the three PDFs

The audit produces three deliverables. Templates exist in `audit-output/`:

1. **Full audit report** — 15 pages, editorial design with TOC, drop cap, two-column exec overview, radar chart, scorecard, detailed findings 4.1–4.6, diverging chart, gaps grid, Gantt timeline, priority checklist, strategic notes, scope, investment summary, closing CTA
2. **One-pager** — single Letter sheet executive brief with mini-radar, comparison scorecard, compressed timeline, top 3 priorities, contact block
3. **GBP supplement** — 3–4 pages focused on Google Business Profile specifically: methodology note, current-state vs. best-practice table, headline finding hero, comparative chart (reviews-across-platforms OR trust-stack scorecard depending on whether GBP data is directly verifiable), 10 ranked critical gaps, 90-day rollout phases, scope crosswalk

#### How to build them

**Don't write from scratch.** Copy the existing template files in `audit-output/` (`report.html`, `onepager.html`, `gbp-supplement.html`) and swap the content blocks:

```bash
cp audit-output/report.html audit-output/<client>-report.html
cp audit-output/onepager.html audit-output/<client>-onepager.html
cp audit-output/gbp-supplement.html audit-output/<client>-gbp-supplement.html
```

Then targeted Edit calls to swap:
- Cover title + lede
- TOC (page numbers stay same)
- Executive overview (drop cap + two-column body + pull quote)
- Snapshot (key facts + intents + alignment notes)
- Three competitor cards
- Detailed scorecard table (28 cells)
- Detailed findings 4.1–4.6 body content
- Strengths / gaps diverging callout text
- 12 key gaps grid
- Priority checklist (16 items)
- Strategic notes
- Scope of services (line items + prices)
- Investment summary table
- Footer / runner business name + URL

For chart data, add client-specific functions in `build.mjs`:
- `radarChart<Client>()` and `radarChart<Client>Compact()`
- `divergingChart<Client>()`
- `timelineChart<Client>()` and `timelineChart<Client>Compact()`
- `reviewsAcrossPlatforms<Client>()` OR `trustStack<Client>()` for the GBP supplement

Then add the new client files to the build pipeline at the end of `build.mjs`.

### Stage 4 — Build + verify

```bash
cd audit-output
node build.mjs
```

Then verify no clipping with the standard overflow check:

```bash
node -e "
import('puppeteer-core').then(async ({default: p}) => {
  const b = await p.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox']});
  for (const file of ['<client>-report.built.html', '<client>-onepager.built.html', '<client>-gbp-supplement.built.html']) {
    const pg = await b.newPage();
    await pg.emulateMediaType('print');
    await pg.setViewport({width:816,height:1056,deviceScaleFactor:1});
    await pg.goto('file://' + process.cwd() + '/' + file, {waitUntil:'networkidle0'});
    await new Promise(r => setTimeout(r, 600));
    const sel = file.includes('onepager') ? '.sheet' : '.page';
    const sizes = await pg.evaluate((s) => Array.from(document.querySelectorAll(s)).map((el,i) => ({page:i+1, ovf: el.scrollHeight - 1056})), sel);
    console.log(file + ':', JSON.stringify(sizes.filter(x => x.ovf > 10)));
  }
  await b.close();
});
"
```

If overflow > 30px on any page, compress the worst offenders before delivering. Tolerance is ~15px (rounding).

For the one-pager, add `overflow: hidden` to `.sheet` if it overflows even slightly — otherwise it paginates to a 2nd mostly-blank page.

Verify the actual PDFs render fully:

```bash
python3 -c "
import pypdfium2 as pdfium
for n in ['Aeolistings-Audit-<Client>.pdf', 'Aeolistings-Audit-<Client>-OnePager.pdf', 'Aeolistings-Audit-<Client>-GBP.pdf']:
    pdf = pdfium.PdfDocument(n)
    print(f'{n}: {len(pdf)} pages')
"
```

Expected: 15, 1, 3–4 respectively.

### Stage 5 — Enroll the client in the recurring AEO tracker

Every client onboarded via this audit pattern gets added to the **monthly recurring prompt-tracker** routine portfolio. This is non-optional — it's how Aeolistings delivers the AEO retainer's monthly performance summary, and it's what produces the trend data the quarterly strategy review needs.

After the audit deliverables are confirmed shipped:

1. **Build the 40-prompt buyer-intent set** for this client (use the audit's identified search intents — typically 8 ranking, 8 cost, 5 comparison, 5 specialty, 5 process, 5 trust, 4 long-tail).
2. **Identify the 3 audit competitors** to flag in tracking (these come from the Competitor Set section of the audit).
3. **Note any client-specific findings worth tracking over time** (mis-attribution incidents, surfacing-complaint issues, brand-confusion risks — see Eco Roofing Solutions and Cruz Development baseline findings for examples of what to watch for).
4. **Create a routine** via the `RemoteTrigger` API (or the `/schedule` skill):
   - Name: `aeo-prompt-tracker-<client-slug>`
   - Cron: `0 13 1 * *` (monthly, 1st of month at 6am Arizona / 1pm UTC — match the existing portfolio cadence)
   - Environment: `env_0147oGPUXiTYVsZkoMCtNhTP` (Default)
   - Model: `claude-sonnet-4-6` (default — see pricing recommendations doc for the sonnet/opus tradeoff)
   - Repo: `https://github.com/beachaeoai/aeolistings-ai`
   - Tools: `Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch`
   - Prompt: full self-contained spec inlined (the agent should not depend on reading any local file). Use the existing routines for Eco Roofing / Cruz / Stag as templates.
5. **Run a baseline (Month 0) immediately** by spawning a `prompt-tracker` agent inline (don't wait for the first scheduled run). Save to `audit-output/aeo-tracking/<client-slug>/<YYYY-MM>.md`.
6. **Confirm to the user** the routine is enrolled and the baseline is captured. Surface any reputation-level findings (mis-attribution, complaint-surfacing) immediately — these are urgent fixes that the audit itself didn't catch.

## Pricing rules for the scope of services

Anchor against the established Stag Electric Arizona quote pattern (see `/src/content/quotes/stag-electric-arizona-q1m7k.md`):

- Website + on-site AEO: $7,500 (only when a new build is needed)
- GBP optimization: $1,250
- Social Foundation: $750 (optional)
- Social Management: $1,500/mo (optional, paired with foundation)
- AEO Retainer: $1,000–$1,500/mo founding-client / $1,500–$2,500/mo standard
- 25% founding-client discount on one-time work

For audit-specific bundles (when a full website rebuild isn't needed):
- Rapid Rescue (technical/on-page fixes): $2,500
- AEO Foundation (FAQ + schema): $1,500–$1,750
- Hub page (single definitional pillar): $1,250
- Authority Content Pack (5 pillars): $2,750–$3,750
- City Pages (6 pages): $3,000
- Service Page Enhancement Bundle: $1,750–$2,250
- Trust Signal Buildout: $1,750–$2,250

Map each line item to the specific gaps in the audit it closes — the `Closes gaps:` annotation is what makes the scope feel custom, not stock.

## Brand language rules

The audit voice is:
- **Calm, evidence-based, consultative** — not hypey, not fear-based
- **Specific over general** — quote real findings, name real competitors, cite real numbers
- **Honest about uncertainty** — flag when something is inferred vs observed
- **Editorial typography** — Instrument Serif for display, Instrument Sans for body, oxblood (#8B2F2F) for accent only
- **No emojis, no exclamation points, no marketing puffery**

The brand palette (mirror `src/styles/global.css`):
```
--bg: #FAF8F1     // paper
--fg: #1A1A1A     // ink
--fg-muted: #6B6B6B
--hairline: #E5E1D6
--accent: #8B2F2F  // oxblood
```

Type stack:
```
--font-serif: "Instrument Serif"
--font-sans: "Instrument Sans"
```

## Common pitfalls

- **Don't fabricate** rankings, traffic numbers, or backlinks — flag clearly when something is inferred
- **Don't use stock language** ("trusted partner", "industry-leading") — every observation should be specific
- **Don't recommend a redesign** when a content fix is what's needed
- **Don't skip the GBP supplement** — it's where the highest-leverage local-search work lives
- **Don't padlock the scope** — show 4–6 line items with real prices, not a single bundled "discovery package"
- **Don't pad city pages** — better to recommend 6 strong city pages than 35 thin ones

## Output format

Three branded PDFs in `audit-output/`:
- `Aeolistings-Audit-<Client>.pdf` — 15-page full audit
- `Aeolistings-Audit-<Client>-OnePager.pdf` — single-sheet brief
- `Aeolistings-Audit-<Client>-GBP.pdf` — 3–4 page GBP supplement

Plus a brief in chat:
- The headline finding (1 sentence)
- Top 3 critical gaps
- Total scope of services (one-time + recurring)
- File paths to the three PDFs

## Related skills (called during the pipeline)

- `faq-rewrite`, `schema-rollout`, `city-page`, `cost-pillar`, `gbp-optimize`, `trust-signals` — these are *implementation* skills the audit's scope of services maps to, not invoked during the audit itself
- The audit *recommends* the implementation skills be invoked next

## Related agents (spawned during the pipeline)

- `local-search-auditor` — site + GBP analysis
- `competitor-researcher` — finds and analyzes 3 direct competitors
- `prompt-tracker` — for retainer-time AI citation tracking, not the initial audit
