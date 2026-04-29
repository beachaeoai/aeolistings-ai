/**
 * Quote events Worker for aeolistings.ai
 *
 * Receives POST /api/quote-event from quote pages on the static site. Two
 * event kinds:
 *
 *   { event: 'view',   slug, quoteId, business, ts, referrer }
 *   { event: 'accept', slug, quoteId, business, name, email, note,
 *                      selectedItems: [{ id, name, price, section }],
 *                      totals: { oneTimeSubtotal, oneTimeDiscount, oneTimeTotal, recurringTotal } }
 *
 * Both are persisted to the QUOTE_EVENTS KV namespace as one record per
 * event (key prefix `view:` or `accept:`). The agency is notified by
 * Resend email with view-dedup (one email per quote per 24 hours, plus a
 * separate "first view ever" notification).
 *
 * Acceptance also sends a receipt email to the client.
 *
 * Bound to: https://aeolistings.ai/api/quote-event via wrangler.toml.
 * Same-origin from quote pages, so no CORS handling needed in production.
 */

interface Env {
  RESEND_API_KEY: string;
  QUOTE_EVENTS?: KVNamespace;
}

type EventKind = 'view' | 'accept';

interface BasePayload {
  event?: EventKind;
  slug?: string;
  quoteId?: string;
  business?: string;
  ts?: number | string;
}

interface ViewPayload extends BasePayload {
  event?: 'view';
  referrer?: string;
}

interface SelectedItem {
  id?: string;
  name?: string;
  price?: number;
  section?: 'one-time' | 'recurring';
}

interface AcceptTotals {
  oneTimeSubtotal?: number;
  oneTimeDiscount?: number;
  oneTimeTotal?: number;
  recurringTotal?: number;
}

interface AcceptPayload extends BasePayload {
  event?: 'accept';
  name?: string;
  email?: string;
  note?: string;
  selectedItems?: SelectedItem[];
  totals?: AcceptTotals;
}

const FROM_ADDRESS = 'AEO Listings <hello@aeolistings.ai>';
const TO_ADDRESS = 'hello@aeolistings.ai';
const QUOTE_BASE_URL = 'https://aeolistings.ai/quote/';

const MAX_FIELD_LEN = 5000;
const MAX_NOTE_LEN = 20000;
const VIEW_DEDUP_TTL_SEC = 60 * 60 * 24; // one notification email per quote per 24h

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeSlug(value: string | undefined): string {
  if (!value) return '';
  // Allow letters, digits, dash, underscore. Reject anything else to avoid
  // KV key injection or HTML-bleed scenarios.
  return value.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 200);
}

function newId(): string {
  // Time-prefixed random id — sortable lexicographically when listed in KV.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

async function sendEmail(env: Env, params: {
  subject: string;
  html: string;
  text: string;
  to?: string | string[];
  replyTo?: string;
  tag?: string;
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    from: FROM_ADDRESS,
    to: Array.isArray(params.to ?? TO_ADDRESS)
      ? params.to ?? [TO_ADDRESS]
      : [params.to ?? TO_ADDRESS],
    subject: params.subject,
    html: params.html,
    text: params.text,
  };
  if (params.replyTo) body.reply_to = params.replyTo;
  if (params.tag) body.tags = [{ name: 'source', value: params.tag }];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '<no body>');
    console.error('Resend send failed', res.status, detail);
    return false;
  }
  return true;
}

function buildViewEmail(p: {
  business: string;
  quoteId: string;
  slug: string;
  isFirst: boolean;
  referrer: string;
  ip: string;
  ua: string;
  whenIso: string;
}): { subject: string; html: string; text: string } {
  const url = QUOTE_BASE_URL + p.slug;
  const headline = p.isFirst
    ? `${p.business} just opened the quote for the first time`
    : `${p.business} opened the quote again`;

  const subject = p.isFirst
    ? `Quote opened: ${p.business} (${p.quoteId})`
    : `Quote re-opened: ${p.business} (${p.quoteId})`;

  const text = [
    headline,
    '',
    `Quote:    ${p.quoteId}`,
    `Business: ${p.business}`,
    `URL:      ${url}`,
    `When:     ${p.whenIso}`,
    `Referrer: ${p.referrer || '(none)'}`,
    `IP:       ${p.ip || '(unknown)'}`,
    `UA:       ${p.ua || '(unknown)'}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:18px;margin:0 0 16px;font-weight:600;">${escapeHtml(headline)}</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Quote</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.quoteId)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Business</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.business)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">URL</td><td style="padding:6px 0;font-size:14px;"><a href="${escapeHtml(url)}" style="color:#8B2F2F;">${escapeHtml(url)}</a></td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">When</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.whenIso)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Referrer</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.referrer || '(none)')}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">IP</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.ip || '(unknown)')}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">User-Agent</td><td style="padding:6px 0;font-size:13px;color:#666;">${escapeHtml(p.ua || '(unknown)')}</td></tr>
  </table>
  <p style="font-size:12px;color:#999;margin:24px 0 0;">Repeat opens within 24 hours are not re-emailed; they are still recorded in KV.</p>
</body></html>`;

  return { subject, html, text };
}

interface CleanSelectedItem {
  id: string;
  name: string;
  price: number;
  section: 'one-time' | 'recurring';
}

interface CleanTotals {
  oneTimeSubtotal: number;
  oneTimeDiscount: number;
  oneTimeTotal: number;
  recurringTotal: number;
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function selectedItemsRowsHtml(items: CleanSelectedItem[]): string {
  if (items.length === 0) {
    return `<tr><td colspan="3" style="padding:8px 14px;font-size:13px;color:#8B2F2F;font-style:italic;">(no services selected)</td></tr>`;
  }
  return items
    .map((it) => {
      const priceLabel = it.section === 'recurring' ? `${fmtUSD(it.price)}/mo` : fmtUSD(it.price);
      const sectionLabel = it.section === 'recurring' ? 'Recurring' : 'One-time';
      return `<tr>
  <td style="padding:8px 14px;font-size:14px;border-bottom:1px solid #E5E1D6;">${escapeHtml(it.name)}</td>
  <td style="padding:8px 14px;font-size:12px;color:#666;border-bottom:1px solid #E5E1D6;">${sectionLabel}</td>
  <td style="padding:8px 14px;font-size:14px;font-family:ui-monospace,Menlo,monospace;text-align:right;border-bottom:1px solid #E5E1D6;">${priceLabel}</td>
</tr>`;
    })
    .join('');
}

function selectedItemsTextLines(items: CleanSelectedItem[]): string {
  if (items.length === 0) return '  (no services selected)';
  return items
    .map((it) => {
      const priceLabel = it.section === 'recurring' ? `${fmtUSD(it.price)}/mo` : fmtUSD(it.price);
      return `  · ${it.name.padEnd(48, ' ')} ${priceLabel}`;
    })
    .join('\n');
}

function buildAcceptAgencyEmail(p: {
  business: string;
  quoteId: string;
  slug: string;
  name: string;
  email: string;
  selectedItems: CleanSelectedItem[];
  totals: CleanTotals;
  note: string;
  ip: string;
  ua: string;
  whenIso: string;
  acceptanceId: string;
}): { subject: string; html: string; text: string } {
  const url = QUOTE_BASE_URL + p.slug;
  const subject = `ACCEPTED: ${p.business} (${p.quoteId}) — ${fmtUSD(p.totals.oneTimeTotal)} upfront, ${fmtUSD(p.totals.recurringTotal)}/mo`;

  const text = [
    `${p.business} accepted quote ${p.quoteId}.`,
    '',
    `Signed by:     ${p.name}`,
    `Email:         ${p.email}`,
    `Acceptance ID: ${p.acceptanceId}`,
    `When:          ${p.whenIso}`,
    `Quote URL:     ${url}`,
    `IP:            ${p.ip || '(unknown)'}`,
    `UA:            ${p.ua || '(unknown)'}`,
    '',
    'SELECTED SCOPE',
    selectedItemsTextLines(p.selectedItems),
    '',
    'TOTALS',
    `  One-time subtotal:  ${fmtUSD(p.totals.oneTimeSubtotal)}`,
    p.totals.oneTimeDiscount > 0 ? `  Discount:           −${fmtUSD(p.totals.oneTimeDiscount)}` : '',
    `  One-time total:     ${fmtUSD(p.totals.oneTimeTotal)}`,
    `  Monthly total:      ${fmtUSD(p.totals.recurringTotal)}/mo`,
    '',
    p.note ? `NOTE FROM CLIENT\n${p.note}` : '(no note)',
  ].filter(Boolean).join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:20px;margin:0 0 8px;font-weight:600;color:#1a1a1a;">Quote accepted</h2>
  <p style="font-size:15px;margin:0 0 24px;color:#1a1a1a;">${escapeHtml(p.business)} accepted quote <strong>${escapeHtml(p.quoteId)}</strong> — ${fmtUSD(p.totals.oneTimeTotal)} upfront, ${fmtUSD(p.totals.recurringTotal)}/mo recurring.</p>

  <h3 style="font-size:12px;color:#666;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Selected scope</h3>
  <table style="border-collapse:collapse;width:100%;margin-bottom:8px;border-top:1px solid #E5E1D6;">
    ${selectedItemsRowsHtml(p.selectedItems)}
  </table>

  <h3 style="font-size:12px;color:#666;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Totals</h3>
  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
    <tr><td style="padding:4px 14px 4px 0;font-size:13px;color:#666;">One-time subtotal</td><td style="padding:4px 0;font-size:14px;text-align:right;font-family:ui-monospace,Menlo,monospace;">${fmtUSD(p.totals.oneTimeSubtotal)}</td></tr>
    ${p.totals.oneTimeDiscount > 0 ? `<tr><td style="padding:4px 14px 4px 0;font-size:13px;color:#8B2F2F;">Discount</td><td style="padding:4px 0;font-size:14px;text-align:right;font-family:ui-monospace,Menlo,monospace;color:#8B2F2F;">−${fmtUSD(p.totals.oneTimeDiscount)}</td></tr>` : ''}
    <tr><td style="padding:6px 14px 6px 0;font-size:14px;font-weight:600;border-top:2px solid #1a1a1a;">One-time total</td><td style="padding:6px 0;font-size:16px;text-align:right;font-family:ui-monospace,Menlo,monospace;font-weight:600;border-top:2px solid #1a1a1a;">${fmtUSD(p.totals.oneTimeTotal)}</td></tr>
    <tr><td style="padding:6px 14px 6px 0;font-size:14px;font-weight:600;">Monthly total</td><td style="padding:6px 0;font-size:16px;text-align:right;font-family:ui-monospace,Menlo,monospace;font-weight:600;">${fmtUSD(p.totals.recurringTotal)}/mo</td></tr>
  </table>

  <h3 style="font-size:12px;color:#666;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Acceptance details</h3>
  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Signed by</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.name)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${escapeHtml(p.email)}" style="color:#8B2F2F;">${escapeHtml(p.email)}</a></td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Acceptance ID</td><td style="padding:6px 0;font-size:13px;font-family:ui-monospace,Menlo,monospace;color:#666;">${escapeHtml(p.acceptanceId)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">When</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.whenIso)}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">Quote URL</td><td style="padding:6px 0;font-size:14px;"><a href="${escapeHtml(url)}" style="color:#8B2F2F;">${escapeHtml(url)}</a></td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">IP</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(p.ip || '(unknown)')}</td></tr>
    <tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">User-Agent</td><td style="padding:6px 0;font-size:13px;color:#666;">${escapeHtml(p.ua || '(unknown)')}</td></tr>
  </table>
  ${p.note ? `<h3 style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Note from client</h3><div style="font-size:15px;line-height:1.55;white-space:pre-wrap;border-left:3px solid #8B2F2F;padding:4px 0 4px 14px;">${escapeHtml(p.note)}</div>` : ''}
  <p style="font-size:12px;color:#999;margin:32px 0 0;">Reply directly to this email — Reply-To is the client.</p>
</body></html>`;

  return { subject, html, text };
}

function buildAcceptClientReceipt(p: {
  business: string;
  quoteId: string;
  slug: string;
  name: string;
  acceptanceId: string;
  whenIso: string;
  selectedItems: CleanSelectedItem[];
  totals: CleanTotals;
}): { subject: string; html: string; text: string } {
  const url = QUOTE_BASE_URL + p.slug;
  const subject = `Receipt: quote ${p.quoteId} accepted — AEO Listings`;
  const firstName = p.name.split(' ')[0] || '';

  const text = [
    `Hi ${firstName},`.trim(),
    '',
    `This confirms you accepted AEO Listings quote ${p.quoteId} on behalf of ${p.business}.`,
    '',
    'YOUR SELECTED SCOPE',
    selectedItemsTextLines(p.selectedItems),
    '',
    'TOTALS',
    `  One-time:   ${fmtUSD(p.totals.oneTimeTotal)}`,
    `  Monthly:    ${fmtUSD(p.totals.recurringTotal)}/mo`,
    '',
    `Acceptance ID: ${p.acceptanceId}`,
    `Recorded:      ${p.whenIso}`,
    `Quote URL:     ${url}`,
    '',
    "We'll follow up within one business day with the contract, the first invoice (50% of the upfront total), and an invite for the kickoff call.",
    '',
    'Questions or changes — just reply.',
    '',
    'Jake Beach',
    'AEO Listings',
    'hello@aeolistings.ai',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <p style="font-size:15px;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
  <p style="font-size:15px;line-height:1.55;margin:0 0 24px;">This confirms you accepted AEO Listings quote <strong>${escapeHtml(p.quoteId)}</strong> on behalf of <strong>${escapeHtml(p.business)}</strong>.</p>

  <h3 style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Your selected scope</h3>
  <table style="border-collapse:collapse;width:100%;margin-bottom:8px;border-top:1px solid #E5E1D6;">
    ${selectedItemsRowsHtml(p.selectedItems)}
  </table>
  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
    <tr><td style="padding:6px 14px 6px 0;font-size:14px;font-weight:600;border-top:2px solid #1a1a1a;">One-time</td><td style="padding:6px 0;font-size:16px;text-align:right;font-family:ui-monospace,Menlo,monospace;font-weight:600;border-top:2px solid #1a1a1a;">${fmtUSD(p.totals.oneTimeTotal)}</td></tr>
    <tr><td style="padding:6px 14px 6px 0;font-size:14px;font-weight:600;">Monthly</td><td style="padding:6px 0;font-size:16px;text-align:right;font-family:ui-monospace,Menlo,monospace;font-weight:600;">${fmtUSD(p.totals.recurringTotal)}/mo</td></tr>
  </table>

  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;border:1px solid #E5E1D6;">
    <tr><td style="padding:8px 14px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #E5E1D6;">Acceptance ID</td><td style="padding:8px 14px;font-size:13px;font-family:ui-monospace,Menlo,monospace;border-bottom:1px solid #E5E1D6;">${escapeHtml(p.acceptanceId)}</td></tr>
    <tr><td style="padding:8px 14px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #E5E1D6;">Recorded</td><td style="padding:8px 14px;font-size:13px;border-bottom:1px solid #E5E1D6;">${escapeHtml(p.whenIso)}</td></tr>
    <tr><td style="padding:8px 14px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Quote URL</td><td style="padding:8px 14px;font-size:13px;"><a href="${escapeHtml(url)}" style="color:#8B2F2F;">${escapeHtml(url)}</a></td></tr>
  </table>
  <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">We'll follow up within one business day with the contract, the first invoice (50% of the upfront total), and an invite for the kickoff call.</p>
  <p style="font-size:15px;line-height:1.55;margin:0 0 24px;">Questions or changes — just reply.</p>
  <p style="font-size:15px;line-height:1.55;margin:0 0 4px;">Jake Beach</p>
  <p style="font-size:13px;color:#666;margin:0 0 4px;">AEO Listings</p>
  <p style="font-size:13px;color:#666;margin:0;"><a href="mailto:hello@aeolistings.ai" style="color:#8B2F2F;">hello@aeolistings.ai</a></p>
</body></html>`;

  return { subject, html, text };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
    }

    let payload: ViewPayload | AcceptPayload;
    try {
      payload = (await request.json()) as ViewPayload | AcceptPayload;
    } catch {
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    }

    const slug = safeSlug(payload.slug);
    const quoteId = (payload.quoteId ?? '').toString().trim().slice(0, 100);
    const business = (payload.business ?? '').toString().trim().slice(0, MAX_FIELD_LEN);

    if (!slug || !quoteId || !business) {
      return jsonResponse({ ok: false, error: 'missing_fields' }, 400);
    }

    const ip = request.headers.get('cf-connecting-ip') ?? '';
    const ua = (request.headers.get('user-agent') ?? '').slice(0, 500);
    const whenIso = new Date().toISOString();

    if (payload.event === 'view') {
      const referrer = ((payload as ViewPayload).referrer ?? '').toString().slice(0, 1000);
      const id = newId();

      const record = {
        kind: 'view',
        slug,
        quoteId,
        business,
        referrer,
        ip,
        ua,
        ts: whenIso,
      };

      // Store the event itself (best-effort — KV may be unbound in dev).
      if (env.QUOTE_EVENTS) {
        ctx.waitUntil(
          env.QUOTE_EVENTS.put(`view:${slug}:${id}`, JSON.stringify(record)),
        );
      }

      // Email throttling: notify Jake on first-ever view + at most once per
      // 24 hours after that. Repeat opens within the window are still
      // recorded in KV; Jake just doesn't get spammed in his inbox.
      let isFirst = false;
      let shouldEmail = true;
      if (env.QUOTE_EVENTS) {
        const firstKey = `firstview:${slug}`;
        const dedupKey = `recentview:${slug}`;
        const firstSeen = await env.QUOTE_EVENTS.get(firstKey);
        if (!firstSeen) {
          isFirst = true;
          ctx.waitUntil(env.QUOTE_EVENTS.put(firstKey, whenIso));
        } else {
          const recent = await env.QUOTE_EVENTS.get(dedupKey);
          if (recent) shouldEmail = false;
        }
        if (shouldEmail) {
          ctx.waitUntil(
            env.QUOTE_EVENTS.put(dedupKey, whenIso, {
              expirationTtl: VIEW_DEDUP_TTL_SEC,
            }),
          );
        }
      }

      if (shouldEmail) {
        const email = buildViewEmail({
          business,
          quoteId,
          slug,
          isFirst,
          referrer,
          ip,
          ua,
          whenIso,
        });
        ctx.waitUntil(
          sendEmail(env, {
            subject: email.subject,
            html: email.html,
            text: email.text,
            tag: 'aeolistings-quote-view',
          }).then(() => undefined),
        );
      }

      return jsonResponse({ ok: true });
    }

    if (payload.event === 'accept') {
      const a = payload as AcceptPayload;
      const name = (a.name ?? '').toString().trim().slice(0, MAX_FIELD_LEN);
      const email = (a.email ?? '').toString().trim().slice(0, MAX_FIELD_LEN);
      const note = (a.note ?? '').toString().trim().slice(0, MAX_NOTE_LEN);

      if (!name || !email) {
        return jsonResponse({ ok: false, error: 'missing_fields' }, 400);
      }
      if (!isValidEmail(email)) {
        return jsonResponse({ ok: false, error: 'invalid_email' }, 400);
      }

      // Sanitize selectedItems — accept only well-formed entries.
      const selectedItems: CleanSelectedItem[] = Array.isArray(a.selectedItems)
        ? a.selectedItems
            .map((it): CleanSelectedItem | null => {
              if (!it || typeof it !== 'object') return null;
              const id = typeof it.id === 'string' ? it.id.trim().slice(0, 100) : '';
              const itemName = typeof it.name === 'string' ? it.name.trim().slice(0, MAX_FIELD_LEN) : '';
              const price = typeof it.price === 'number' && Number.isFinite(it.price) ? it.price : 0;
              const section = it.section === 'recurring' ? 'recurring' : 'one-time';
              if (!id || !itemName) return null;
              return { id, name: itemName, price, section };
            })
            .filter((x): x is CleanSelectedItem => x !== null)
            .slice(0, 50)
        : [];

      if (selectedItems.length === 0) {
        return jsonResponse({ ok: false, error: 'empty_scope' }, 400);
      }

      const totalsIn = a.totals ?? {};
      const totals: CleanTotals = {
        oneTimeSubtotal: typeof totalsIn.oneTimeSubtotal === 'number' && Number.isFinite(totalsIn.oneTimeSubtotal) ? totalsIn.oneTimeSubtotal : 0,
        oneTimeDiscount: typeof totalsIn.oneTimeDiscount === 'number' && Number.isFinite(totalsIn.oneTimeDiscount) ? totalsIn.oneTimeDiscount : 0,
        oneTimeTotal: typeof totalsIn.oneTimeTotal === 'number' && Number.isFinite(totalsIn.oneTimeTotal) ? totalsIn.oneTimeTotal : 0,
        recurringTotal: typeof totalsIn.recurringTotal === 'number' && Number.isFinite(totalsIn.recurringTotal) ? totalsIn.recurringTotal : 0,
      };

      const acceptanceId = newId();
      const record = {
        kind: 'accept',
        slug,
        quoteId,
        business,
        name,
        email,
        selectedItems,
        totals,
        note,
        ip,
        ua,
        ts: whenIso,
        acceptanceId,
      };

      if (env.QUOTE_EVENTS) {
        // Synchronous put on accept — we want this durable before responding.
        try {
          await env.QUOTE_EVENTS.put(`accept:${slug}:${acceptanceId}`, JSON.stringify(record));
        } catch (err) {
          console.error('KV put failed on accept', err);
        }
      }

      const agencyEmail = buildAcceptAgencyEmail({
        business,
        quoteId,
        slug,
        name,
        email,
        selectedItems,
        totals,
        note,
        ip,
        ua,
        whenIso,
        acceptanceId,
      });

      const agencySent = await sendEmail(env, {
        subject: agencyEmail.subject,
        html: agencyEmail.html,
        text: agencyEmail.text,
        replyTo: email,
        tag: 'aeolistings-quote-accept',
      });

      if (!agencySent) {
        return jsonResponse({ ok: false, error: 'send_failed' }, 502);
      }

      // Client receipt — best-effort. If this fails the acceptance still
      // succeeded for the agency, so don't fail the request.
      const clientEmail = buildAcceptClientReceipt({
        business,
        quoteId,
        slug,
        name,
        acceptanceId,
        whenIso,
        selectedItems,
        totals,
      });
      ctx.waitUntil(
        sendEmail(env, {
          subject: clientEmail.subject,
          html: clientEmail.html,
          text: clientEmail.text,
          to: email,
          tag: 'aeolistings-quote-accept-receipt',
        }).then(() => undefined),
      );

      return jsonResponse({ ok: true, acceptanceId });
    }

    return jsonResponse({ ok: false, error: 'unknown_event' }, 400);
  },
} satisfies ExportedHandler<Env>;
