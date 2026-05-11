// POST /api/intake/[token]/credentials
//
// Sprint 4. Records the *method* a client chose to grant access for a
// credential category (domain registrar, GBP, social, etc.). NEVER accepts
// raw credentials — see spec §5. The body is one entry at a time:
//
//   { credential_type: 'gbp', method: 'delegate', notes?: '...' }
//
// Token is verified but NOT rotated: this is a side-channel write similar
// to file uploads. Step navigation still goes through POST /api/intake/[token].

import type { APIRoute } from 'astro';
import { isValidMethod, upsertCredential, listCredentials, rowToEntry } from '../../../../lib/credentials';
import { verifyToken } from '../../../../lib/tokens';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json(500, { error: 'runtime env unavailable' });

  const token = params.token;
  if (!token) return json(400, { error: 'missing token' });

  const intake_id = await verifyToken(token, env);
  if (!intake_id) return json(401, { error: 'invalid or expired token' });

  let body: { credential_type?: string; method?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }

  const credential_type = String(body.credential_type ?? '').trim();
  const method = String(body.method ?? '').trim();
  if (!credential_type) return json(400, { error: 'missing credential_type' });
  if (!isValidMethod(method)) {
    return json(400, { error: 'invalid method' });
  }

  // Reject anything that looks like a raw secret (defense-in-depth — the form
  // never sends one, but we don't want a future client mistake to leak into D1).
  const notes = body.notes ? String(body.notes).slice(0, 500) : undefined;
  if (notes && /(password|api[_-]?key|token|secret)\s*[:=]/i.test(notes)) {
    return json(400, { error: 'notes look like they contain a credential — never paste passwords here' });
  }

  const row = await upsertCredential(intake_id, { credential_type, method, notes }, env);
  const all = await listCredentials(intake_id, env);

  return json(200, {
    credential: rowToEntry(row),
    credentials: all.map(rowToEntry),
  });
};
