#!/usr/bin/env node
/**
 * queue-nudge.mjs — daily reminder that a Publish PR is aging.
 *
 * Run by .github/workflows/queue-nudge-daily.yml every day at 09:00
 * America/Phoenix (16:00 UTC).
 *
 * What it does:
 *   1. Fetch all open PRs on the repo
 *   2. Filter to titles starting with "Publish:"
 *   3. Compute each PR's age in days
 *   4. If any are stale, send ONE email listing them, escalating in tone
 *      by the OLDEST PR's age (so a single 12-day-old PR wins over five
 *      3-day-old PRs)
 *   5. Exit silently if nothing is stale (don't spam an empty inbox)
 *
 * Escalation buckets:
 *   • age < 3 days  → skip entirely (fresh, don't nudge)
 *   • 3–6 days      → gentle nudge
 *   • 7–9 days      → concerned tone
 *   • 10+ days      → urgent — queue is definitely backed up
 *
 * Required env:
 *   GH_TOKEN         — GitHub token (Actions provides automatically)
 *   RESEND_API_KEY   — Resend API key (repo secret)
 *
 * Manual test:
 *   node scripts/queue-nudge.mjs                # runs against live GitHub state
 *   node scripts/queue-nudge.mjs --dry-run      # prints what email would send
 */

const REPO = 'beachaeoai/aeolistings-ai';
const EMAIL_FROM = 'AEO Listings <hello@aeolistings.ai>';
const EMAIL_TO = 'hello@aeolistings.ai';
const DRY_RUN = process.argv.includes('--dry-run');

// Escalation thresholds (days). MIN_AGE is the floor — anything younger
// gets no email at all so you're not pinged about PRs you might action
// the same day they open.
const MIN_AGE = 3;
const CONCERNED_AGE = 7;
const URGENT_AGE = 10;

// ──────────────────────────────────────────────────────────────
// GitHub API
// ──────────────────────────────────────────────────────────────

async function fetchOpenPublishPrs() {
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error('GH_TOKEN not set');
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/pulls?state=open&per_page=100&sort=created&direction=asc`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub API error ${res.status}: ${detail}`);
  }
  const prs = await res.json();
  return prs.filter((p) => p.title.startsWith('Publish:'));
}

function ageInDays(isoDate) {
  const ms = Date.now() - Date.parse(isoDate);
  return Math.floor(ms / 86_400_000);
}

// ──────────────────────────────────────────────────────────────
// Email via Resend
// ──────────────────────────────────────────────────────────────

async function sendEmail({ subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [EMAIL_TO],
      subject,
      html,
      text,
      tags: [{ name: 'source', value: 'aeolistings-queue-nudge' }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed: HTTP ${res.status} — ${detail}`);
  }
  return res.json();
}

function htmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ──────────────────────────────────────────────────────────────
// Email content by escalation tier
// ──────────────────────────────────────────────────────────────

function pickTier(maxAge) {
  if (maxAge >= URGENT_AGE) return 'urgent';
  if (maxAge >= CONCERNED_AGE) return 'concerned';
  return 'gentle';
}

function tierMeta(tier, oldestAge, count) {
  const wordCount = count === 1 ? 'a Publish PR' : `${count} Publish PRs`;
  if (tier === 'urgent') {
    return {
      subject: count === 1
        ? `Urgent: PR blocking your publishing queue (${oldestAge} days)`
        : `Urgent: ${count} Publish PRs blocking the queue (oldest ${oldestAge} days)`,
      accent: '#8B2F2F',
      headline: `Publishing queue is backed up (${oldestAge} days)`,
      lead: `${wordCount} sitting unactioned for ${oldestAge} day${oldestAge === 1 ? '' : 's'}. Every cron tick this blocks costs another skipped publish — the queue behind ${count === 1 ? 'it' : 'them'} keeps growing.`,
      cta: 'Action or close now',
    };
  }
  if (tier === 'concerned') {
    return {
      subject: count === 1
        ? `PR blocking the queue (${oldestAge} days)`
        : `${count} Publish PRs waiting (oldest ${oldestAge} days)`,
      accent: '#B45A3C',
      headline: `${wordCount} waiting on you`,
      lead: `The oldest is ${oldestAge} days old. The next scheduled cron tick will skip if this stays unmerged — the queue is on the brink of blocking.`,
      cta: 'Review on GitHub',
    };
  }
  return {
    subject: count === 1
      ? `Reminder: Publish PR waiting (${oldestAge} days)`
      : `Reminder: ${count} Publish PRs waiting (oldest ${oldestAge} days)`,
    accent: '#666666',
    headline: `Just a nudge — ${wordCount} waiting`,
    lead: `The oldest has been open for ${oldestAge} day${oldestAge === 1 ? '' : 's'}. No immediate action required; take a look when you have a minute.`,
    cta: 'Review on GitHub',
  };
}

function buildEmailHtml({ tier, oldestAge, prs }) {
  const meta = tierMeta(tier, oldestAge, prs.length);
  const rows = prs
    .map((p) => `
      <tr>
        <td style="padding:10px 12px 10px 0;font-size:13px;color:#666;white-space:nowrap;vertical-align:top;">#${p.number}</td>
        <td style="padding:10px 12px 10px 0;font-size:13px;color:#666;white-space:nowrap;vertical-align:top;">${p.age} day${p.age === 1 ? '' : 's'}</td>
        <td style="padding:10px 0;font-size:14px;color:#1a1a1a;vertical-align:top;">
          <a href="${htmlEscape(p.html_url)}" style="color:#1a1a1a;">${htmlEscape(p.title)}</a>
        </td>
      </tr>`)
    .join('');
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:18px;margin:0 0 12px;font-weight:600;color:${meta.accent};">${htmlEscape(meta.headline)}</h2>
  <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#1a1a1a;">${htmlEscape(meta.lead)}</p>

  <table style="border-collapse:collapse;width:100%;margin:16px 0 24px;border-top:1px solid #e0ddd4;">
    ${rows}
  </table>

  <div style="margin:24px 0 12px;">
    <a href="https://github.com/${REPO}/pulls?q=is%3Aopen+is%3Apr+%22Publish%3A%22" style="display:inline-block;background:${meta.accent};color:#FAF8F1;padding:11px 20px;text-decoration:none;font-weight:600;border-radius:2px;font-size:14px;">${meta.cta} →</a>
  </div>

  <hr style="border:none;border-top:1px solid #e0ddd4;margin:24px 0;" />
  <p style="font-size:12px;color:#999;margin:0;line-height:1.5;">
    Sent by the daily queue-nudge check. Escalates at ${MIN_AGE} / ${CONCERNED_AGE} / ${URGENT_AGE} days. No email is sent when everything is fresh (&lt;${MIN_AGE} days).
  </p>
</body></html>`;
}

function buildEmailText({ tier, oldestAge, prs }) {
  const meta = tierMeta(tier, oldestAge, prs.length);
  const lines = [meta.headline, '', meta.lead, '', '─────────────────────────────────'];
  for (const p of prs) {
    lines.push(`#${p.number}  ${p.age}d  ${p.title}`);
    lines.push(`  ${p.html_url}`);
  }
  lines.push('', '─────────────────────────────────');
  lines.push('', `Sent by daily queue-nudge. Escalates at ${MIN_AGE}/${CONCERNED_AGE}/${URGENT_AGE} days.`);
  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '▸ DRY RUN — no email will be sent\n' : '');

  const openPrs = await fetchOpenPublishPrs();
  const stale = openPrs
    .map((p) => ({
      number: p.number,
      title: p.title,
      html_url: p.html_url,
      created_at: p.created_at,
      age: ageInDays(p.created_at),
    }))
    .filter((p) => p.age >= MIN_AGE)
    .sort((a, b) => b.age - a.age); // oldest first

  console.log(`Open Publish PRs total: ${openPrs.length}`);
  console.log(`Stale (age ≥ ${MIN_AGE} days): ${stale.length}`);

  if (stale.length === 0) {
    console.log('✓ Nothing stale. Exiting silently.');
    return;
  }

  const oldestAge = stale[0].age;
  const tier = pickTier(oldestAge);

  console.log(`▸ Oldest PR: #${stale[0].number} (${oldestAge} days) — tier: ${tier}`);
  for (const p of stale) {
    console.log(`    #${p.number}  ${p.age}d  ${p.title}`);
  }

  if (DRY_RUN) {
    const html = buildEmailHtml({ tier, oldestAge, prs: stale });
    const text = buildEmailText({ tier, oldestAge, prs: stale });
    const { subject } = tierMeta(tier, oldestAge, stale.length);
    console.log('\n── Would send email ──');
    console.log(`Subject: ${subject}`);
    console.log(`\n${text}`);
    return;
  }

  const { subject } = tierMeta(tier, oldestAge, stale.length);
  await sendEmail({
    subject,
    html: buildEmailHtml({ tier, oldestAge, prs: stale }),
    text: buildEmailText({ tier, oldestAge, prs: stale }),
  });
  console.log(`✓ Nudge sent to ${EMAIL_TO} (tier: ${tier})`);
}

// Only run when invoked directly, not when imported.
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main().catch((e) => {
    console.error('✗ Fatal error:');
    console.error(e);
    process.exit(1);
  });
}
