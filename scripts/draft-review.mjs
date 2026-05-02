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
// File mutation: remove `draft: true` line from frontmatter.
// (The collection schema defaults draft to false, so absence === published.)
// ──────────────────────────────────────────────────────────────

function flipDraftFlag(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const updated = text.replace(/\r?\ndraft:\s*true(?=\r?\n)/g, '');
  if (updated === text) {
    throw new Error(`No \`draft: true\` line found in ${filePath} — frontmatter may be malformed.`);
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

async function main() {
  console.log(DRY_RUN ? '▸ DRY RUN — no changes will be made\n' : '');

  const draft = findNextDraft();
  if (!draft) {
    console.log('✓ No drafts in queue. Nothing to do today.');
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

  // Don't open a duplicate PR if one for this slug is already open
  const existingPr = tryRun(`gh pr list --head ${branch} --state open --json url --jq '.[0].url // empty'`);
  if (existingPr) {
    console.log(`⚠️  Open PR already exists for ${draft.slug}:`);
    console.log(`    ${existingPr}`);
    console.log('Skipping (action it manually first, then the next cron will pick the next draft).');
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

main().catch((e) => {
  console.error('✗ Fatal error:');
  console.error(e);
  process.exit(1);
});
