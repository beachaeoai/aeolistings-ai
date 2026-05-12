// Resend transactional email — Sprint 5.
//
// On intake submit, send a confirmation email to the client (with the magic
// link for future edits) and a deep-link summary to ops. Resend's REST API
// is a single POST; we use direct fetch to keep the Workers bundle small.
//
// API: https://resend.com/docs/api-reference/emails/send-email

const RESEND_API_BASE = 'https://api.resend.com';

export interface EmailEnv {
  RESEND_API_KEY: string;
  SENDER_EMAIL: string;
  fetcher?: typeof fetch;
}

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}

async function resendFetch(env: EmailEnv, path: string, body: unknown): Promise<unknown> {
  const fetcher = env.fetcher ?? fetch;
  const res = await fetcher(`${RESEND_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`resend ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`resend ${path} returned non-JSON`);
  }
}

export async function sendEmail(env: EmailEnv, args: SendEmailArgs): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    from: `Aeolistings Intake <${env.SENDER_EMAIL}>`,
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
    html: args.html,
  };
  if (args.text) body.text = args.text;
  if (args.reply_to) body.reply_to = args.reply_to;
  const result = (await resendFetch(env, '/emails', body)) as { id?: string };
  return { id: result.id ?? '' };
}

export interface IntakeSubmittedClientEmailArgs {
  to: string;
  client_first_name: string;
  business_name: string;
  edit_url: string;
}

export async function sendClientSubmissionConfirmation(
  env: EmailEnv,
  args: IntakeSubmittedClientEmailArgs,
): Promise<{ id: string }> {
  const subject = `${args.business_name} intake received — we're on it`;
  const text = [
    `Hi ${args.client_first_name},`,
    '',
    `We received your intake for ${args.business_name}. Our team is reviewing it now and will reach out shortly to confirm the kickoff.`,
    '',
    `Need to edit something? Use the same magic link — it stays good for 7 days:`,
    args.edit_url,
    '',
    'You can also reply directly to this email and we will route it to the right person.',
    '',
    '— The Aeolistings team',
  ].join('\n');
  const html = `
    <p>Hi ${escapeHtml(args.client_first_name)},</p>
    <p>We received your intake for <strong>${escapeHtml(args.business_name)}</strong>. Our team is reviewing it now and will reach out shortly to confirm the kickoff.</p>
    <p>Need to edit something? Use the same magic link — it stays good for 7 days:<br>
       <a href="${args.edit_url}">${escapeHtml(args.edit_url)}</a></p>
    <p>You can also reply directly to this email and we'll route it to the right person.</p>
    <p>— The Aeolistings team</p>
  `;
  return sendEmail(env, { to: args.to, subject, html, text });
}

export interface IntakeSubmittedOpsEmailArgs {
  to: string;
  business_name: string;
  intake_id: string;
  notion_url?: string;
  edit_url: string;
  client_email: string;
  client_name: string;
  pending_items: string[];
}

export async function sendOpsSubmissionAlert(
  env: EmailEnv,
  args: IntakeSubmittedOpsEmailArgs,
): Promise<{ id: string }> {
  const subject = `Intake submitted: ${args.business_name}`;
  const lines = [
    `${args.business_name} (${args.intake_id})`,
    `Client: ${args.client_name} <${args.client_email}>`,
    args.notion_url ? `Notion: ${args.notion_url}` : '',
    `Magic link (edit): ${args.edit_url}`,
    args.pending_items.length > 0
      ? `Pending integrations: ${args.pending_items.join(', ')}`
      : 'All integrations succeeded.',
  ].filter(Boolean);
  const text = lines.join('\n');
  const html = `<pre style="font-family:system-ui,sans-serif">${escapeHtml(text)}</pre>`;
  return sendEmail(env, { to: args.to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
