// POST /api/intake/create
//
// Admin-only endpoint that mints a fresh intake record + magic-link token from
// signed-contract data. Body must match CreateIntakeInput. Sprint 1 returns the
// magic-link URL inline; later sprints route it through Resend instead.
//
// Auth: requires header `X-Admin-Key: <HMAC_SIGNING_KEY>`. Reusing the HMAC
// secret avoids a second secret in Sprint 1; replaced with a separate admin
// token (or Workers binding) before opening this beyond ops.

import type { APIRoute } from 'astro';
import { createIntake, type CreateIntakeInput } from '../../../lib/intake';
import { createToken } from '../../../lib/tokens';

function bad(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidInput(v: unknown): v is CreateIntakeInput {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.contract_id === 'string' &&
    typeof o.client_email === 'string' &&
    typeof o.client_name === 'string' &&
    typeof o.business_name === 'string' &&
    typeof o.scope_flags === 'object' &&
    o.scope_flags !== null
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return bad(500, 'runtime env unavailable');

  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== env.HMAC_SIGNING_KEY) {
    return bad(401, 'unauthorized');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad(400, 'invalid JSON body');
  }
  if (!isValidInput(body)) return bad(400, 'invalid input shape');

  const record = await createIntake(body, env);
  const token = await createToken(record.id, env);

  return new Response(
    JSON.stringify({
      intake_id: record.id,
      token,
      magic_link: `${env.APP_URL}/c/${token}`,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
};
