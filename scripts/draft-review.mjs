#!/usr/bin/env node
/**
 * draft-review.mjs — pick the next draft blog post and queue it for review.
 *
 * Run by .github/workflows/draft-review-cron.yml on a fixed cadence
 * (~every 6 days). What it does:
 *
 *   1. Scan src/content/blog/*.md for posts with `draft: true` in frontmatter
 *   2. Pick the OLDEST draft (by pubDate ascending) — to publish in calendar order
 *   3. If no drafts remain: exit cleanly, no-op
 *   4. Otherwise:
 *        a. Create branch `publish/<slug>`
 *        b. Remove the `draft: true` line (defaults to false in the schema)
 *        c. Commit + push the branch
 *        d. Open a PR via `gh pr create` with the full post in the PR body
 *        e. Email the owner via Resend: PR link + content preview
 *
 * The PR is the approval interface:
 *   - Click Merge to publish (Cloudflare Pages auto-deploys within 60s)
 *   - Click Close to skip (post stays draft, comes back on next cron tick)
 *   - Edit the file in-PR before merging if you want to tweak first
 *
 * Local testing:
 *   node scripts/draft-review.mjs --dry-run   # print what would happen, no side effects
 *
 * Required env (production):
 *   GH_TOKEN          — GitHub token with PR-write scope (Actions provides automatically)
 *   RESEND_API_KEY    — Resend API key (set as GitHub Actions repo secret)
 *
 * Manual trigger from GitHub UI: Actions tab → "Draft review" → Run workflow.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────

const BLOG_DIR = 'src/content/blog';
const SITE_BASE = 'https://aeolistings.ai';
const EMAIL_FROM = 'AEO Listings <hello@aeolistings.ai>';
const EMAIL_TO = 'hello@aeolistings.ai';
const DRY_RUN = process.argv.includes('--dry-run');

// ──────────────────────────────────────────────────────────────
// Frontmatter parser — minimal, handles only what our schema uses.
// (Avoids adding a YAML dependency for one use case.)
// ──────────────────────────────────────────────────────────────

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { fm: {}, body: text };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const lm = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!lm) continue;
    let v = lm[2].trim();
    // Strip surrounding quotes (handles "title" and 'title')
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    fm[lm[1]] = v;
  }
  return { fm, body: match[2] };
}

// ──────────────────────────────────────────────────────────────
// Find the next draft to publish
// ──────────────────────────────────────────────────────────────

function findNextDraft() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const drafts = [];
  for (const f of files) {
    const filePath = join(BLOG_DIR, f);
    const text = readFileSync(filePath, 'utf8');
    const { fm, body } = parseFrontmatter(text);
    if (fm.draft === 'true') {
      drafts.push({
        slug: f.replace(/\.(md|mdx)$/, ''),
        filePath,
        title: fm.title || f,
        description: fm.description || '',
        pubDate: fm.pubDate || '9999-12-31',
        body,
        rawText: text,
      });
    }
  }
  if (drafts.length === 0) return null;
  drafts.sort((a, b) => a.pubDate.localeCompare(b.pubDate));
  return drafts[0];
}

// ──────────────────────────────────────────────────────────────
// File mutation: remove `draft: true` AND update pubDate to today.
//
// Two changes happen at publish time:
//   1. The `draft: true` line is removed (the schema defaults draft to
//      false, so absence === published).
//   2. The `pubDate` is rewritten to today's UTC date.
//
// Why update pubDate: the original pubDate in a draft is just a queue-
// ordering hint, not a publication date. Without this, the live blog
// shows the draft-authoring date (often weeks earlier) as the publish
// date — confusing for readers and wrong for schema.
// ──────────────────────────────────────────────────────────────

function todayInPublishTimezone() {
  // YYYY-MM-DD in America/Phoenix (the agency's local timezone), NOT UTC.
  //
  // Why Phoenix not UTC: scheduled cron runs at 09:00 Phoenix = 16:00 UTC,
  // where the UTC and Phoenix dates match — so for the normal flow this
  // makes no difference. But workflow_dispatch can fire at any time of
  // day, and if it runs after 17:00 Phoenix (00:00+ UTC) the UTC date is
  // already "tomorrow" while the agency (and its readers) are still on
  // today's date. Using Phoenix consistently means the displayed pubDate
  // always matches the day the agency considers the post to have shipped.
  //
  // Astro coerces this YYYY-MM-DD to a Date at midnight UTC, and the
  // blog index formatter renders in UTC during the Cloudflare build, so
  // a Phoenix-date string produces a matching display date everywhere.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Phoenix',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function flipDraftFlag(filePath) {
  const text = readFileSync(filePath, 'utf8');
  let updated = text.replace(/\r?\ndraft:\s*true(?=\r?\n)/g, '');
  if (updated === text) {
    throw new Error(`No \`draft: true\` line found in ${filePath} — frontmatter may be malformed.`);
  }
  // Rewrite pubDate to today's date in America/Phoenix (the agency's
  // local timezone). Matches "pubDate: YYYY-MM-DD" with optional
  // surrounding whitespace; preserves the rest of the line.
  const today = todayInPublishTimezone();
  const pubDateReplaced = updated.replace(
    /^pubDate:\s*\S+\s*$/m,
    `pubDate: ${today}`,
  );
  if (pubDateReplaced === updated) {
    // No pubDate field present — unusual but not fatal; just warn.
    console.warn(`  ⚠️  ${filePath} has no pubDate field — published date will be missing in schema.`);
  } else {
    updated = pubDateReplaced;
  }
  writeFileSync(filePath, updated, 'utf8');
}

// ──────────────────────────────────────────────────────────────
// Shell helpers
// ──────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts }).trim();
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function tryRun(cmd) {
  try {
    return runCapture(cmd);
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Email via Resend
// ──────────────────────────────────────────────────────────────

function htmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function sendEmail({ subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('  ⚠️  RESEND_API_KEY not set — skipping email notification.');
    return null;
  }
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
      tags: [{ name: 'source', value: 'aeolistings-draft-review' }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed: HTTP ${res.status} — ${detail}`);
  }
  return res.json();
}

function buildEmailHtml({ draft, prUrl, liveUrl }) {
  // Truncate body preview at ~5000 chars to keep the email reasonable
  const bodyPreview = draft.body.trim();
  const truncated = bodyPreview.length > 5000;
  const previewText = truncated ? bodyPreview.slice(0, 5000) + '\n\n[…truncated — see full content in the PR]' : bodyPreview;

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:18px;margin:0 0 16px;font-weight:600;">Next blog post ready for review</h2>

  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Title</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${htmlEscape(draft.title)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Slug</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;"><code>${htmlEscape(draft.slug)}</code></td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Description</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${htmlEscape(draft.description)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Live URL</td><td style="padding:6px 0;font-size:14px;"><a href="${htmlEscape(liveUrl)}" style="color:#8B2F2F;">${htmlEscape(liveUrl)}</a></td></tr>
  </table>

  <div style="margin:24px 0 32px;">
    <a href="${htmlEscape(prUrl)}" style="display:inline-block;background:#8B2F2F;color:#FAF8F1;padding:12px 22px;text-decoration:none;font-weight:600;border-radius:2px;font-size:14px;">Review on GitHub →</a>
  </div>

  <h3 style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">How to action</h3>
  <ul style="font-size:14px;line-height:1.6;padding-left:20px;margin:0 0 24px;">
    <li><strong>Publish now</strong> — open the PR and click <strong>Merge pull request</strong>. Cloudflare Pages auto-deploys within ~60 seconds.</li>
    <li><strong>Skip this one</strong> — close the PR. Same post returns on the next cron tick (~6 days).</li>
    <li><strong>Edit before publishing</strong> — use the GitHub web editor on the file in this PR, commit to the branch, then merge.</li>
    <li><strong>Permanently skip a post</strong> — delete or rename it in the repo, or change its <code>pubDate</code> to push it later in queue order.</li>
  </ul>

  <hr style="border:none;border-top:1px solid #e0ddd4;margin:32px 0;" />

  <h3 style="font-size:14px;color:#1a1a1a;margin:0 0 12px;font-weight:600;">Post body preview</h3>
  <div style="font-size:14px;line-height:1.65;white-space:pre-wrap;background:#fff;padding:16px;border-left:3px solid #8B2F2F;max-height:600px;overflow-y:auto;color:#1a1a1a;border-radius:0 2px 2px 0;">${htmlEscape(previewText)}</div>

  <p style="font-size:12px;color:#999;margin:32px 0 0;">Sent automatically by .github/workflows/draft-review-cron.yml — runs every ~6 days. To change cadence, edit the cron expression in that file.</p>
</body></html>`;
}

function buildEmailText({ draft, prUrl, liveUrl }) {
  return `Next blog post ready for review

Title:       ${draft.title}
Slug:        ${draft.slug}
Description: ${draft.description}
Live URL:    ${liveUrl}

Review on GitHub: ${prUrl}

How to action:
  • Publish now — open the PR, click "Merge pull request"
  • Skip — close the PR (same post returns in ~6 days)
  • Edit first — edit the file in the PR, commit, merge

──────────────────────────────────────────────────────────────
Post body preview
──────────────────────────────────────────────────────────────

${draft.body.trim()}

──────────────────────────────────────────────────────────────
Sent automatically by .github/workflows/draft-review-cron.yml
`;
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

/** Count how many posts are currently published (for the empty-queue email). */
function countPublishedPosts() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  let count = 0;
  for (const f of files) {
    const { fm } = parseFrontmatter(readFileSync(join(BLOG_DIR, f), 'utf8'));
    if (fm.draft !== 'true') count += 1;
  }
  return count;
}

function buildEmptyQueueEmail(publishedCount) {
  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:18px;margin:0 0 16px;font-weight:600;">Draft queue is empty — nothing to publish today</h2>

  <p style="font-size:15px;line-height:1.65;margin:0 0 16px;">The scheduled review just ran and found no drafts waiting. <strong>Nothing is broken</strong> — the cron is firing correctly, there's just no content for it to surface.</p>

  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Posts published</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${publishedCount}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Drafts in queue</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">0</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Next cron tick</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">~6 days from now</td></tr>
  </table>

  <h3 style="font-size:12px;color:#666;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">To resume the cadence</h3>
  <p style="font-size:14px;line-height:1.65;margin:0 0 12px;">Add one or more <code>.md</code> files to <code>src/content/blog/</code> with frontmatter that includes <code>draft: true</code>. The next cron tick will pick the oldest one (by <code>pubDate</code>), open a PR, and email you for review.</p>

  <p style="font-size:14px;line-height:1.65;margin:0 0 12px;">Minimum frontmatter shape:</p>
  <pre style="font-size:13px;background:#fff;padding:14px;border-left:3px solid #8B2F2F;border-radius:0 2px 2px 0;line-height:1.5;color:#1a1a1a;white-space:pre-wrap;">---
title: "Your post title"
description: "A one-line description for meta tags and the blog index."
pubDate: 2026-06-15
author: "AEO Listings"
tags: ["tag-1", "tag-2"]
draft: true
---

Post body in Markdown here.</pre>

  <h3 style="font-size:12px;color:#666;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">To stop these reminder emails</h3>
  <p style="font-size:14px;line-height:1.65;margin:0;">If you'd rather not be reminded until you actually add drafts: disable the workflow in GitHub (Actions tab → Draft review → "···" → Disable workflow). Re-enable when you add new drafts.</p>

  <p style="font-size:12px;color:#999;margin:32px 0 0;">Sent automatically by .github/workflows/draft-review-cron.yml — scripts/draft-review.mjs, empty-queue branch.</p>
</body></html>`;
  const text = `Draft queue is empty — nothing to publish today.

Nothing is broken — the cron fired correctly, there's just no content
for it to surface.

  Posts published: ${publishedCount}
  Drafts in queue: 0
  Next cron tick:  ~6 days from now

To resume the cadence:
  Add one or more .md files to src/content/blog/ with frontmatter
  that includes "draft: true". Next cron tick picks the oldest
  one by pubDate.

To stop these reminders until you add drafts:
  GitHub → Actions → Draft review → "···" → Disable workflow.

Sent automatically by .github/workflows/draft-review-cron.yml.
`;
  return { html, text };
}

/** Real-time "queue blocked" alert email — sent when the cron tries to
 *  publish `draft` but finds a PR already open blocking that slug.
 *  Complements the daily queue-nudge cron; this fires the instant a
 *  cron tick gets skipped, so silent-fail can't happen.
 */
function buildQueueBlockedEmail({ draft, existing }) {
  const prUrl = existing?.url || '';
  const prNumber = existing?.number ? `#${existing.number}` : '';
  const createdAt = existing?.createdAt || existing?.created_at;
  const daysAgoText = createdAt
    ? ` (opened ${Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 86_400_000))} days ago)`
    : '';

  const subject = `Queue blocked — cron skipped today's publish (${prNumber || 'open PR'})`;
  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:18px;margin:0 0 12px;font-weight:600;color:#8B2F2F;">Cron tick skipped — queue is blocked</h2>
  <p style="font-size:15px;line-height:1.65;margin:0 0 16px;">
    Today's scheduled cron tried to surface <strong>${htmlEscape(draft.title)}</strong> for review, but skipped because there's still an open Publish PR from a previous cycle${daysAgoText}. Every cron tick this stays open costs another skipped publish.
  </p>

  <table style="border-collapse:collapse;width:100%;margin:16px 0 24px;">
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Would have surfaced</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${htmlEscape(draft.title)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Blocking PR</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${prUrl ? `<a href="${htmlEscape(prUrl)}" style="color:#8B2F2F;">${htmlEscape(prNumber || prUrl)}</a>` : '(no URL)'}</td></tr>
  </table>

  <div style="margin:24px 0 12px;">
    <a href="${htmlEscape(prUrl)}" style="display:inline-block;background:#8B2F2F;color:#FAF8F1;padding:11px 20px;text-decoration:none;font-weight:600;border-radius:2px;font-size:14px;">Merge or close the blocking PR →</a>
  </div>

  <hr style="border:none;border-top:1px solid #e0ddd4;margin:24px 0;" />
  <p style="font-size:12px;color:#999;margin:0;line-height:1.5;">
    Sent by .github/workflows/draft-review-cron.yml when it detected the queue was blocked. Daily nudges from queue-nudge-daily.yml will follow if the PR stays open.
  </p>
</body></html>`;
  const text = `Cron tick skipped — queue is blocked.

Today's scheduled cron tried to surface "${draft.title}" but skipped
because there's still an open Publish PR from a previous cycle${daysAgoText}.

  Would have surfaced:  ${draft.title}
  Blocking PR:          ${prNumber} ${prUrl}

Action needed: merge or close the blocking PR so the queue can move.

${prUrl}
`;
  return { html, text, subject };
}

async function main() {
  console.log(DRY_RUN ? '▸ DRY RUN — no changes will be made\n' : '');

  const draft = findNextDraft();
  if (!draft) {
    const published = countPublishedPosts();
    console.log(`✓ No drafts in queue. Posts already published: ${published}.`);

    if (DRY_RUN) {
      console.log('▸ DRY RUN — would send empty-queue notification email');
      return;
    }

    // Email the owner so they know the cron ran and what to do next.
    // Without this, a silent exit looks identical to "the system is broken".
    console.log('▸ Sending empty-queue notification email...');
    try {
      const { html, text } = buildEmptyQueueEmail(published);
      await sendEmail({
        subject: 'Draft queue empty — add more posts to resume the cadence',
        html,
        text,
      });
      console.log(`    ✓ Sent to ${EMAIL_TO}`);
    } catch (e) {
      console.error(`    ✗ Email send failed: ${e.message}`);
    }
    return;
  }

  const branch = `publish/${draft.slug}`;
  const liveUrl = `${SITE_BASE}/blog/${draft.slug}`;

  console.log(`▸ Next draft selected:`);
  console.log(`    Slug:     ${draft.slug}`);
  console.log(`    Title:    ${draft.title}`);
  console.log(`    pubDate:  ${draft.pubDate}`);
  console.log(`    Live URL: ${liveUrl}`);
  console.log(`    Branch:   ${branch}`);
  console.log('');

  if (DRY_RUN) {
    console.log('▸ DRY RUN — would now:');
    console.log('    1. git checkout -b ' + branch);
    console.log('    2. Remove `draft: true` from ' + draft.filePath);
    console.log('    3. git commit + push branch');
    console.log('    4. gh pr create');
    console.log('    5. Send email to ' + EMAIL_TO);
    console.log('');
    console.log('▸ Done.');
    return;
  }

  // Don't open a duplicate PR if one for this slug is already open.
  // Also send an alert email so a silent skip doesn't disappear —
  // the queue-nudge cron catches slow-open PRs, but this catches
  // "the cron just fired and skipped RIGHT NOW because you have a
  // blocking PR" in real time.
  const existingPrJson = tryRun(
    `gh pr list --head ${branch} --state open --json url,number,createdAt --jq '.[0] // empty'`,
  );
  if (existingPrJson) {
    let existing = { url: existingPrJson };
    try {
      existing = JSON.parse(existingPrJson);
    } catch {
      // Fall back to old shape — url string only
    }
    console.log(`⚠️  Open PR already exists for ${draft.slug}:`);
    console.log(`    ${existing.url || existingPrJson}`);
    console.log('Skipping (action it manually first, then the next cron will pick the next draft).');

    // Send the "queue blocked" alert. Best-effort — the queue-nudge
    // daily cron is the durable safety net; this is the immediate ping.
    try {
      const { html, text, subject } = buildQueueBlockedEmail({ draft, existing });
      await sendEmail({ subject, html, text });
      console.log(`▸ Sent queue-blocked alert to ${EMAIL_TO}`);
    } catch (e) {
      console.error(`✗ Queue-blocked alert send failed: ${e.message}`);
    }
    return;
  }

  // Configure git identity (GitHub Actions runner needs this)
  run('git config user.name "github-actions[bot]"', { silent: true });
  run('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { silent: true });

  // Branch + flip + commit + push
  console.log('▸ Creating publish branch...');
  run(`git checkout -b ${branch}`, { silent: true });
  flipDraftFlag(draft.filePath);
  run(`git add ${JSON.stringify(draft.filePath)}`, { silent: true });
  run(`git commit -m ${JSON.stringify(`Publish: ${draft.title}`)}`, { silent: true });
  run(`git push origin ${branch}`, { silent: true });

  // Build PR body (full post inline so review can happen entirely in GitHub UI)
  const prBody = [
    `# Ready to publish: ${draft.title}`,
    '',
    `**Live URL after merge:** ${liveUrl}`,
    `**Description:** ${draft.description}`,
    `**pubDate:** ${draft.pubDate}`,
    '',
    '## How to action',
    '',
    '- **Publish now** → click **Merge pull request** below. Cloudflare Pages auto-deploys within ~60 seconds.',
    '- **Skip / postpone** → click **Close pull request**. The post stays as a draft and the next cron tick (~6 days) will surface it again.',
    '- **Edit before publishing** → use the GitHub web editor on the file in this PR, commit to this branch, then merge.',
    '',
    '---',
    '',
    '## Full post content (current draft)',
    '',
    '```markdown',
    draft.rawText,
    '```',
    '',
    '---',
    '',
    '_Opened automatically by `.github/workflows/draft-review-cron.yml`._',
  ].join('\n');

  // Use --body-file for safe handling of multi-line content with special chars
  writeFileSync('/tmp/pr-body.md', prBody, 'utf8');
  console.log('▸ Opening PR via gh CLI...');
  const prUrl = runCapture(
    `gh pr create --title ${JSON.stringify(`Publish: ${draft.title}`)} --body-file /tmp/pr-body.md --head ${branch} --base main`
  );
  console.log(`    ${prUrl}`);

  // Notify via email (best-effort — PR is the source of truth, email is a nudge)
  console.log('▸ Sending notification email...');
  try {
    await sendEmail({
      subject: `Ready to publish: ${draft.title}`,
      html: buildEmailHtml({ draft, prUrl, liveUrl }),
      text: buildEmailText({ draft, prUrl, liveUrl }),
    });
    console.log(`    ✓ Sent to ${EMAIL_TO}`);
  } catch (e) {
    console.error(`    ✗ Email send failed: ${e.message}`);
    console.log('    PR is still open — review on GitHub if email never arrives.');
  }

  console.log('');
  console.log('▸ Done. Action the PR when you have a moment.');
}

// Only auto-run main() when invoked directly (e.g. `node scripts/draft-review.mjs`
// from the GitHub Action). Skip when this module is imported as a library —
// otherwise an inspect-via-import accidentally creates a branch and a PR.
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

const invokedDirectly =
  argv[1] && fileURLToPath(import.meta.url) === argv[1];

if (invokedDirectly) {
  main().catch((e) => {
    console.error('✗ Fatal error:');
    console.error(e);
    process.exit(1);
  });
}
