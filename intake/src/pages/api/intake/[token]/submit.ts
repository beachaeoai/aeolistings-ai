// POST /intake/api/intake/[token]/submit
//
// Sprint 5. The terminal action of the intake flow:
//   1. Verify the magic-link token.
//   2. Reject if the intake is already submitted (the side effects are
//      not idempotent — a second submit would create a second Notion page,
//      a second 1Password note, etc.). Edits go through the regular save
//      endpoint (PATCH /api/intake/[token]) and Sprint 6's edit-flow.
//   3. Flip status='submitted' + stamp submitted_at.
//   4. Fire each side-effect (Slack / Notion / 1Password / R2-manifest /
//      email) independently. Failures are captured + reported in the
//      response under `warnings` but never 500 the request — partial
//      success is the right shape for a submit-once action whose
//      downstream surfaces are best-effort.
//
// Token is verified but NOT rotated: submit is the last client-side write;
// the token stays valid for the 7-day edit window per spec §5.

import type { APIRoute } from 'astro';
import { getIntakeById, markIntakeSubmitted } from '../../../../lib/intake';
import { listCredentials, rowToEntry } from '../../../../lib/credentials';
import { verifyToken } from '../../../../lib/tokens';
import { createClientPageTree, type NotionIntakeSummary } from '../../../../lib/notion';
import { notifyIntakeSubmitted } from '../../../../lib/slack';
import { postCredentialSummary, clientSlug } from '../../../../lib/1password';
import { buildBrandAssetManifest } from '../../../../lib/drive-sync';
import {
  sendClientSubmissionConfirmation,
  sendOpsSubmissionAlert,
} from '../../../../lib/email';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface IntegrationWarning {
  step: 'slack' | 'notion' | 'onepassword' | 'drive_manifest' | 'email_client' | 'email_ops';
  error: string;
}

function scopeSummary(scope_flags: Record<string, boolean>): string {
  const enabled = Object.entries(scope_flags)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);
  return enabled.length ? enabled.join(', ') : '(no scope flags set)';
}

export const POST: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json(500, { error: 'runtime env unavailable' });

  const token = params.token;
  if (!token) return json(400, { error: 'missing token' });

  const intake_id = await verifyToken(token, env);
  if (!intake_id) return json(401, { error: 'invalid or expired token' });

  const existing = await getIntakeById(intake_id, env);
  if (!existing) return json(404, { error: 'intake not found' });

  if (existing.status === 'submitted' && existing.submitted_at) {
    return json(409, {
      error: 'intake already submitted',
      intake: existing,
    });
  }

  const submitted = await markIntakeSubmitted(intake_id, env);
  if (!submitted) return json(500, { error: 'failed to mark intake submitted' });

  const warnings: IntegrationWarning[] = [];
  const submitted_at_iso = new Date((submitted.submitted_at ?? Date.now() / 1000) * 1000).toISOString();
  const edit_url = `${env.APP_URL}/c/${token}`;
  const slug = clientSlug(submitted.business_name);

  // Step 8 / Step 6 / Step 5 derived data — read from D1 where the source
  // of truth lives. Credentials and files come from their own tables; the
  // rest is fine to read from data JSON (the form is the only writer).
  const credRows = await listCredentials(intake_id, env).catch(() => []);
  const credentials = credRows.map(rowToEntry);

  const manifest = await buildBrandAssetManifest(intake_id, env).catch((err) => {
    warnings.push({ step: 'drive_manifest', error: (err as Error).message });
    return { intake_id, file_count: 0, total_bytes: 0, files: [] };
  });

  const data = (submitted.data ?? {}) as Record<string, any>;
  const step6 = data.step6 ?? {};
  const step8 = data.step8 ?? {};
  const cities = Array.isArray(step6.cities)
    ? step6.cities.map((c: any) => ({ name: String(c.name ?? '') })).filter((c: any) => c.name)
    : [];
  const named_experts = Array.isArray(step8.named_experts)
    ? step8.named_experts
        .map((e: any) => ({ name: e?.name, title: e?.title }))
        .filter((e: any) => e.name || e.title)
    : [];

  const notionSummary: NotionIntakeSummary = {
    intake_id: submitted.id,
    business_name: submitted.business_name,
    client_name: submitted.client_name,
    client_email: submitted.client_email,
    scope_summary: scopeSummary(submitted.scope_flags),
    primary_contact: step8.primary_contact,
    named_experts,
    cities,
    credentials: credentials.map((c) => ({
      credential_type: c.credential_type,
      method: c.method,
      status: c.status,
    })),
    files: manifest.files.map((f) => ({ category: f.category, filename: f.filename })),
    submitted_at_iso,
    edit_url,
  };

  // ── Notion: create the client engagement page ────────────────────
  let notion_url: string | undefined;
  try {
    const created = await createClientPageTree(env, notionSummary);
    notion_url = created.url;
  } catch (err) {
    warnings.push({ step: 'notion', error: (err as Error).message });
  }

  // ── 1Password: post credential summary as a Secure Note ─────────
  try {
    await postCredentialSummary(env, {
      business_name: submitted.business_name,
      client_slug: slug,
      intake_id: submitted.id,
      credentials,
    });
  } catch (err) {
    warnings.push({ step: 'onepassword', error: (err as Error).message });
  }

  // ── Slack: notify ops ───────────────────────────────────────────
  try {
    await notifyIntakeSubmitted(env, {
      business_name: submitted.business_name,
      intake_id: submitted.id,
      notion_url,
      edit_url,
      pending_items: warnings.map((w) => w.step),
    });
  } catch (err) {
    warnings.push({ step: 'slack', error: (err as Error).message });
  }

  // ── Email: client confirmation ─────────────────────────────────
  const firstName = submitted.client_name.split(' ')[0] ?? submitted.client_name;
  try {
    await sendClientSubmissionConfirmation(env, {
      to: submitted.client_email,
      client_first_name: firstName,
      business_name: submitted.business_name,
      edit_url,
    });
  } catch (err) {
    warnings.push({ step: 'email_client', error: (err as Error).message });
  }

  // ── Email: ops alert ───────────────────────────────────────────
  try {
    await sendOpsSubmissionAlert(env, {
      to: env.SENDER_EMAIL,
      business_name: submitted.business_name,
      intake_id: submitted.id,
      notion_url,
      edit_url,
      client_email: submitted.client_email,
      client_name: submitted.client_name,
      pending_items: warnings.map((w) => w.step),
    });
  } catch (err) {
    warnings.push({ step: 'email_ops', error: (err as Error).message });
  }

  return json(200, {
    intake: submitted,
    warnings,
    notion_url,
    file_count: manifest.file_count,
  });
};
