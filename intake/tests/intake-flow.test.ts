// End-to-end Sprint 1 flow at the API-handler level:
//   create → resume (verify) → save (verify + consume + rotate)
// Drives the actual route handlers with a fake Cloudflare runtime.

import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { POST as createIntakePost } from '../src/pages/api/intake/create';
import {
  GET as resumeGet,
  POST as savePost,
} from '../src/pages/api/intake/[token]';
import { FakeD1 } from './helpers/fake-d1';
import { FakeKV } from './helpers/fake-kv';

interface FlowEnv {
  DB: D1Database;
  INTAKE_TOKENS: KVNamespace;
  HMAC_SIGNING_KEY: string;
  APP_URL: string;
}

function buildEnv(): FlowEnv & { _kv: FakeKV; _db: FakeD1 } {
  const _kv = new FakeKV();
  const _db = new FakeD1();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    HMAC_SIGNING_KEY: 'flow-key-bbbbbbbbbbbbbbbbbbbbbbbb',
    APP_URL: 'https://intake.test.aeolistings.ai',
    _kv,
    _db,
  };
}

function ctx(env: FlowEnv, request: Request, params: Record<string, string> = {}) {
  return {
    request,
    params,
    locals: { runtime: { env } },
  } as unknown as APIContext;
}

const sampleInput = {
  contract_id: 'q1m7k',
  client_email: 'owner@stagelectric.test',
  client_name: 'Sam Stag',
  business_name: 'Stag Electric',
  scope_flags: { website: true, gbp: true, retainer: true },
};

async function callCreate(env: FlowEnv, body: unknown, adminKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminKey !== undefined) headers['x-admin-key'] = adminKey;
  const req = new Request('https://x/api/intake/create', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return createIntakePost(ctx(env, req));
}

describe('POST /api/intake/create', () => {
  it('rejects missing/invalid admin key with 401', async () => {
    const env = buildEnv();
    const noKey = await callCreate(env, sampleInput);
    expect(noKey.status).toBe(401);
    const wrong = await callCreate(env, sampleInput, 'wrong');
    expect(wrong.status).toBe(401);
  });

  it('rejects malformed JSON with 400', async () => {
    const env = buildEnv();
    const res = await callCreate(env, '{bad json', env.HMAC_SIGNING_KEY);
    expect(res.status).toBe(400);
  });

  it('rejects invalid input shape with 400', async () => {
    const env = buildEnv();
    const res = await callCreate(env, { contract_id: 'x' }, env.HMAC_SIGNING_KEY);
    expect(res.status).toBe(400);
  });

  it('returns 201 with intake_id, token, and magic link', async () => {
    const env = buildEnv();
    const res = await callCreate(env, sampleInput, env.HMAC_SIGNING_KEY);
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      intake_id: string;
      token: string;
      magic_link: string;
    };
    expect(body.intake_id).toMatch(/.{20,}/);
    expect(body.token.split('.')).toHaveLength(2);
    expect(body.magic_link).toBe(`${env.APP_URL}/c/${body.token}`);
  });
});

describe('GET /api/intake/[token] — resume', () => {
  it('returns 401 for an unknown token', async () => {
    const env = buildEnv();
    const req = new Request('https://x/api/intake/garbage');
    const res = await resumeGet(ctx(env, req, { token: 'garbage' }));
    expect(res.status).toBe(401);
  });

  it('returns the intake record for a valid token', async () => {
    const env = buildEnv();
    const created = (await (
      await callCreate(env, sampleInput, env.HMAC_SIGNING_KEY)
    ).json()) as { intake_id: string; token: string };

    const res = await resumeGet(
      ctx(env, new Request(`https://x/api/intake/${created.token}`), {
        token: created.token,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { intake: { id: string; status: string } };
    expect(body.intake.id).toBe(created.intake_id);
    expect(body.intake.status).toBe('in_progress');
  });
});

describe('POST /api/intake/[token] — save (verify + rotate)', () => {
  async function bootstrap() {
    const env = buildEnv();
    const created = (await (
      await callCreate(env, sampleInput, env.HMAC_SIGNING_KEY)
    ).json()) as { intake_id: string; token: string };
    return { env, ...created };
  }

  it('persists patched data and rotates the token', async () => {
    const { env, intake_id, token } = await bootstrap();

    const saveRes = await savePost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { step1: { confirmed: true } },
            current_step: 2,
          }),
        }),
        { token },
      ),
    );
    expect(saveRes.status).toBe(200);
    const saveBody = (await saveRes.json()) as {
      intake: { id: string; current_step: number; data: Record<string, unknown> };
      token: string;
      magic_link: string;
    };
    expect(saveBody.intake.id).toBe(intake_id);
    expect(saveBody.intake.current_step).toBe(2);
    expect(saveBody.intake.data).toEqual({ step1: { confirmed: true } });
    expect(saveBody.token).not.toBe(token);
    expect(saveBody.magic_link.endsWith(saveBody.token)).toBe(true);
  });

  it('invalidates the old token after save (single-use rotation)', async () => {
    const { env, token } = await bootstrap();

    const saveRes = await savePost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { foo: 'bar' } }),
        }),
        { token },
      ),
    );
    const { token: newToken } = (await saveRes.json()) as { token: string };

    // Old token: 401
    const oldRes = await resumeGet(
      ctx(env, new Request(`https://x/api/intake/${token}`), { token }),
    );
    expect(oldRes.status).toBe(401);

    // New token: 200
    const newRes = await resumeGet(
      ctx(env, new Request(`https://x/api/intake/${newToken}`), {
        token: newToken,
      }),
    );
    expect(newRes.status).toBe(200);
  });

  it('rejects a save with an invalid token (401)', async () => {
    const { env } = await bootstrap();
    const res = await savePost(
      ctx(
        env,
        new Request('https://x/api/intake/junk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { x: 1 } }),
        }),
        { token: 'junk' },
      ),
    );
    expect(res.status).toBe(401);
  });

  it('merges patched fields with existing data', async () => {
    const { env, token } = await bootstrap();

    const first = await savePost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { a: 1 } }),
        }),
        { token },
      ),
    );
    const { token: t2 } = (await first.json()) as { token: string };

    const second = await savePost(
      ctx(
        env,
        new Request(`https://x/api/intake/${t2}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { b: 2 } }),
        }),
        { token: t2 },
      ),
    );
    const body = (await second.json()) as {
      intake: { data: Record<string, unknown> };
    };
    expect(body.intake.data).toEqual({ a: 1, b: 2 });
  });

  it('rejects malformed bodies with 400', async () => {
    const { env, token } = await bootstrap();
    const res = await savePost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_step: 'not-an-int' }),
        }),
        { token },
      ),
    );
    expect(res.status).toBe(400);
  });
});
