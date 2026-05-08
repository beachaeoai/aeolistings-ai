// POST /api/intake/[token]/prefill
//
// Sprint 2. Given a website URL, return inferred Step-2 fields (business
// identity, phones, address, licenses) plus source provenance. The client
// confirms or edits the values in the form — never a source of truth.
//
// Token is verified but NOT rotated: prefill is a side-channel lookup, not
// a save. Saves still go through POST /api/intake/[token].

import type { APIRoute } from 'astro';
import { getIntakeById } from '../../../../lib/intake';
import { prefillFromWebsite } from '../../../../lib/prefill';
import { verifyToken } from '../../../../lib/tokens';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface PrefillBody {
  url: string;
  business_name?: string;
}

function isValidBody(v: unknown): v is PrefillBody {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (typeof o.url !== 'string' || !o.url.trim()) return false;
  if (o.business_name !== undefined && typeof o.business_name !== 'string') {
    return false;
  }
  return true;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json(500, { error: 'runtime env unavailable' });

  const token = params.token;
  if (!token) return json(400, { error: 'missing token' });

  const intake_id = await verifyToken(token, env);
  if (!intake_id) return json(401, { error: 'invalid or expired token' });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }
  if (!isValidBody(body)) return json(400, { error: 'invalid input shape' });

  // Default the business name from the intake record if the caller didn't
  // pass one — saves the form from having to plumb it through.
  let businessName = body.business_name;
  if (!businessName) {
    const record = await getIntakeById(intake_id, env);
    businessName = record?.business_name;
  }

  const result = await prefillFromWebsite(body.url, env, {
    businessName,
  });

  return json(200, { prefill: result });
};
