/**
 * Contact form Worker for aeolistings.ai
 *
 * Receives POST requests from the /contact form on the static site, validates
 * input, runs anti-spam checks (honeypot + time-trap), sends an email via
 * Resend, and returns JSON.
 *
 * Deployment binds this to https://aeolistings.ai/api/contact via the route in
 * wrangler.toml. The form on /contact uses a same-origin fetch to that path,
 * so no CORS handling is needed.
 *
 * RESEND_API_KEY is set as an encrypted secret:
 *   wrangler secret put RESEND_API_KEY
 *
 * The visible "From" address is hello@aeolistings.ai. Resend signs outbound
 * mail with DKIM on send.aeolistings.ai (the verified subdomain). DMARC
 * passes via organizational-domain alignment. Recipients see hello@; the
 * Reply-To header is set to the form submitter so a Gmail reply goes
 * straight to the prospect.
 */

interface Env {
  RESEND_API_KEY: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  business?: string;
  city?: string;
  service?: string;
  message?: string;
  /** Honeypot — must be empty. Real users never see/fill this. */
  _company?: string;
  /** Time-trap — millisecond timestamp set when the form was rendered. */
  _ts?: number | string;
}

const FROM_ADDRESS = 'AEO Listings <hello@aeolistings.ai>';
const TO_ADDRESS = 'hello@aeolistings.ai';
const MIN_FORM_AGE_MS = 3000;
const MAX_FIELD_LEN = 5000;
const MAX_MESSAGE_LEN = 20000;

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
  // Form-level sanity check. Resend itself rejects malformed addresses.
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

function buildEmailHtml(p: Required<Pick<ContactPayload, 'name' | 'email' | 'message'>> & ContactPayload): string {
  const rows: [string, string | undefined][] = [
    ['Name', p.name],
    ['Email', p.email],
    ['Business', p.business],
    ['City / service area', p.city],
    ['Service of interest', p.service],
  ];

  const rowsHtml = rows
    .filter(([, value]) => value && value.trim().length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${escapeHtml(value!)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;background:#FAF8F1;">
  <h2 style="font-size:18px;margin:0 0 16px;font-weight:600;">New inquiry from aeolistings.ai</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">${rowsHtml}</table>
  <h3 style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Message</h3>
  <div style="font-size:15px;line-height:1.55;white-space:pre-wrap;border-left:3px solid #8B2F2F;padding:4px 0 4px 14px;">${escapeHtml(p.message)}</div>
  <p style="font-size:12px;color:#999;margin:32px 0 0;">Reply directly to this email — Reply-To is set to the submitter.</p>
</body></html>`;
}

function buildEmailText(p: Required<Pick<ContactPayload, 'name' | 'email' | 'message'>> & ContactPayload): string {
  const lines: string[] = ['New inquiry from aeolistings.ai', ''];
  lines.push(`Name:     ${p.name}`);
  lines.push(`Email:    ${p.email}`);
  if (p.business) lines.push(`Business: ${p.business}`);
  if (p.city) lines.push(`City:     ${p.city}`);
  if (p.service) lines.push(`Service:  ${p.service}`);
  lines.push('', '---', '', p.message, '', '(Reply directly — Reply-To is set to the submitter.)');
  return lines.join('\n');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      // Same-origin in production via the route binding. CORS preflight only
      // matters during local wrangler dev where origins differ.
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

    let payload: ContactPayload;
    try {
      payload = (await request.json()) as ContactPayload;
    } catch {
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    }

    // ── Anti-spam ────────────────────────────────────────────────
    // Honeypot: bots fill every input. Real users never see/fill _company.
    if (typeof payload._company === 'string' && payload._company.trim().length > 0) {
      // Pretend success to not signal the trap to the spammer.
      return jsonResponse({ ok: true });
    }
    // Time-trap: form must have been on screen at least 3 seconds.
    if (payload._ts !== undefined && payload._ts !== null && payload._ts !== '') {
      const ts = Number(payload._ts);
      if (Number.isFinite(ts)) {
        const age = Date.now() - ts;
        if (age >= 0 && age < MIN_FORM_AGE_MS) {
          return jsonResponse({ ok: true });
        }
      }
    }

    // ── Validation ───────────────────────────────────────────────
    const name = (payload.name ?? '').trim();
    const email = (payload.email ?? '').trim();
    const message = (payload.message ?? '').trim();

    if (!name || !email || !message) {
      return jsonResponse({ ok: false, error: 'missing_fields' }, 400);
    }
    if (
      name.length > MAX_FIELD_LEN ||
      email.length > MAX_FIELD_LEN ||
      message.length > MAX_MESSAGE_LEN
    ) {
      return jsonResponse({ ok: false, error: 'field_too_long' }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, error: 'invalid_email' }, 400);
    }

    const business = (payload.business ?? '').trim().slice(0, MAX_FIELD_LEN);
    const city = (payload.city ?? '').trim().slice(0, MAX_FIELD_LEN);
    const service = (payload.service ?? '').trim().slice(0, MAX_FIELD_LEN);

    const cleaned = { name, email, business, city, service, message };

    // ── Send via Resend ──────────────────────────────────────────
    const subject = `New inquiry from ${name}${business ? ` (${business})` : ''}`;
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: email,
        subject,
        text: buildEmailText(cleaned),
        html: buildEmailHtml(cleaned),
        // Tag for Resend dashboard analytics
        tags: [{ name: 'source', value: 'aeolistings-contact-form' }],
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => '<no body>');
      console.error('Resend send failed', resendRes.status, detail);
      return jsonResponse({ ok: false, error: 'send_failed' }, 502);
    }

    return jsonResponse({ ok: true });
  },
} satisfies ExportedHandler<Env>;
