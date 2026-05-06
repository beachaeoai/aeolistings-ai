// GET  /api/intake/[token] — resume flow: verify token, return intake data
// POST /api/intake/[token] — save flow: verify, patch data, rotate token
//
// Token verification is via HMAC + KV record lookup (see lib/tokens.ts).
// Save rotates the single-use ID, returning a new token for the same intake.

import type { APIRoute } from 'astro';
import { getIntakeById, updateIntakeData } from '../../../lib/intake';
import { rotateToken, verifyToken } from '../../../lib/tokens';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json(500, { error: 'runtime env unavailable' });

  const token = params.token;
  if (!token) return json(400, { error: 'missing token' });

  const intake_id = await verifyToken(token, env);
  if (!intake_id) return json(401, { error: 'invalid or expired token' });

  const record = await getIntakeById(intake_id, env);
  if (!record) return json(404, { error: 'intake not found' });

  return json(200, { intake: record });
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json(500, { error: 'runtime env unavailable' });

  const token = params.token;
  if (!token) return json(400, { error: 'missing token' });

  const intake_id = await verifyToken(token, env);
  if (!intake_id) return json(401, { error: 'invalid or expired token' });

  let patch: { data?: Record<string, unknown>; current_step?: number };
  try {
    patch = await request.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  if (
    patch.data !== undefined &&
    (typeof patch.data !== 'object' || patch.data === null)
  ) {
    return json(400, { error: '`data` must be an object' });
  }
  if (
    patch.current_step !== undefined &&
    (typeof patch.current_step !== 'number' || !Number.isInteger(patch.current_step))
  ) {
    return json(400, { error: '`current_step` must be an integer' });
  }

  const updated = await updateIntakeData(intake_id, patch, env);
  if (!updated) return json(404, { error: 'intake not found' });

  const new_token = await rotateToken(token, env);

  return json(200, {
    intake: updated,
    token: new_token,
    magic_link: `${env.APP_URL}/c/${new_token}`,
  });
};
