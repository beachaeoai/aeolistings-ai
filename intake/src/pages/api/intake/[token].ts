// GET  /intake/api/intake/[token] — resume flow: verify token, return intake data
// POST /intake/api/intake/[token] — save flow: verify, patch data, rotate token
//   (deployed URLs — Astro `base: '/intake'` prefixes every route. The doubled
//    "intake" in the path is from `src/pages/api/intake/` colliding with the
//    base prefix; tracked as a follow-up rename.)
//
// Token verification is via HMAC + KV record lookup (see lib/tokens.ts).
// Save rotates the single-use ID, returning a new token for the same intake.

import type { APIRoute } from 'astro';
import {
  applyEditToSubmitted,
  getIntakeById,
  reconcileEditingTimeout,
  updateIntakeData,
} from '../../../lib/intake';
import { rotateToken, verifyToken } from '../../../lib/tokens';
import { notifyIntakeEdited } from '../../../lib/slack';

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

  const fetched = await getIntakeById(intake_id, env);
  if (!fetched) return json(404, { error: 'intake not found' });

  // Sprint 6 — Lazy reconcile: a row that's been 'editing' for >24h with no
  // further saves flips back to 'submitted' on the next read. Cheaper than a
  // dedicated scheduled handler and self-healing for abandoned edit sessions.
  const record = await reconcileEditingTimeout(fetched, env);

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

  // Sprint 6 — Edit flow. If the row is already submitted, this save is an
  // edit: flip status to 'editing' in the same UPDATE and notify ops via
  // Slack. If the row is already 'editing' (a prior edit, still within 24h),
  // the regular save keeps it there — the original Slack notification is
  // enough; don't re-notify on every keystroke.
  const before = await getIntakeById(intake_id, env);
  if (!before) return json(404, { error: 'intake not found' });

  const warnings: { step: 'slack'; error: string }[] = [];
  let updated;
  let status_flipped_to_editing = false;
  if (before.status === 'submitted') {
    updated = await applyEditToSubmitted(intake_id, patch, env);
    status_flipped_to_editing = true;
  } else {
    updated = await updateIntakeData(intake_id, patch, env);
  }
  if (!updated) return json(404, { error: 'intake not found' });

  if (status_flipped_to_editing) {
    const edited_step = describeEditedStep(patch);
    try {
      await notifyIntakeEdited(env, {
        business_name: updated.business_name,
        intake_id: updated.id,
        edited_step,
      });
    } catch (err) {
      // Slack down does NOT 500 the save — mirrors Sprint 5's submit pattern.
      warnings.push({ step: 'slack', error: (err as Error).message });
    }
  }

  const new_token = await rotateToken(token, env);

  return json(200, {
    intake: updated,
    token: new_token,
    magic_link: `${env.APP_URL}/c/${new_token}`,
    warnings,
  });
};

function describeEditedStep(patch: {
  data?: Record<string, unknown>;
  current_step?: number;
}): string {
  const keys = patch.data ? Object.keys(patch.data) : [];
  if (keys.length === 1) return keys[0]!;
  if (keys.length > 1) return keys.join(', ');
  if (typeof patch.current_step === 'number') return `step ${patch.current_step}`;
  return 'intake';
}
