// Submit endpoint tests — Sprint 5.
//
// Drives POST /api/intake/[token]/submit with a fake Cloudflare runtime + a
// fetcher override per integration. Mirrors the prefill.test.ts pattern so
// the suite stays hermetic.
//
// Coverage:
//   1. happy path: status flips, every integration is called, no warnings
//   2. partial failure: Slack down does NOT 500 the request (returns 200
//      with `warnings: [{step: 'slack', ...}]`)
//   3. double submit: second call returns 409 and side effects do not fire
//   4. unauthorized token: 401, no side effects
//   5. payload shape: notion + 1password get the credentials read from D1,
//      not from data.step5

import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { POST as createIntakePost } from '../src/pages/api/intake/create';
import { POST as savePost } from '../src/pages/api/intake/[token]';
import { POST as credPost } from '../src/pages/api/intake/[token]/credentials';
import { POST as uploadPost } from '../src/pages/api/intake/[token]/upload';
import { POST as submitPost } from '../src/pages/api/intake/[token]/submit';
import { FakeD1Extended } from './helpers/fake-d1-extended';
import { FakeKV } from './helpers/fake-kv';
import { FakeR2 } from './helpers/fake-r2';

interface SubmitEnv {
  DB: D1Database;
  INTAKE_TOKENS: KVNamespace;
  UPLOADS: R2Bucket;
  HMAC_SIGNING_KEY: string;
  APP_URL: string;
  NOTION_INTEGRATION_TOKEN: string;
  NOTION_TEMPLATE_PAGE_ID: string;
  NOTION_PARENT_PAGE_ID: string;
  ONEPASSWORD_SERVICE_ACCOUNT_TOKEN: string;
  ONEPASSWORD_VAULT_UUID: string;
  SLACK_WEBHOOK_INTAKE_OPS: string;
  SLACK_WEBHOOK_BUILD: string;
  RESEND_API_KEY: string;
  SENDER_EMAIL: string;
  fetcher?: typeof fetch;
}

interface RouteEntry {
  match: (url: string, init?: RequestInit) => boolean;
  respond: (url: string, init?: RequestInit) => Response | Promise<Response>;
}

function makeFetcher(routes: RouteEntry[]) {
  const calls: { url: string; body?: string }[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : (url as URL | Request).toString();
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ url: u, body });
    for (const r of routes) {
      if (r.match(u, init)) return r.respond(u, init);
    }
    return new Response('not-found', { status: 404 });
  };
  return { fetcher: fetcher as unknown as typeof fetch, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildEnv(): SubmitEnv & { _db: FakeD1Extended; _kv: FakeKV; _r2: FakeR2 } {
  const _kv = new FakeKV();
  const _db = new FakeD1Extended();
  const _r2 = new FakeR2();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    UPLOADS: _r2 as unknown as R2Bucket,
    HMAC_SIGNING_KEY: 'submit-key-zzzzzzzzzzzzzzzzzzzzzzzz',
    APP_URL: 'https://aeolistings.test/intake',
    NOTION_INTEGRATION_TOKEN: 'secret_test',
    NOTION_TEMPLATE_PAGE_ID: '8b0e273250f1492e91918e43e2e3ba66',
    NOTION_PARENT_PAGE_ID: '3585fbf10b5e8057b035f7abb6cb5a7d',
    ONEPASSWORD_SERVICE_ACCOUNT_TOKEN: 'ops_test',
    ONEPASSWORD_VAULT_UUID: 'qqzfcrgw4bbqnkirebfwtylh5i',
    SLACK_WEBHOOK_INTAKE_OPS: 'https://hooks.slack.com/services/T/B/intake',
    SLACK_WEBHOOK_BUILD: 'https://hooks.slack.com/services/T/B/build',
    RESEND_API_KEY: 're_test',
    SENDER_EMAIL: 'intake@aeolistings.test',
    _db,
    _kv,
    _r2,
  };
}

function ctx(env: SubmitEnv, request: Request, params: Record<string, string> = {}) {
  return {
    request,
    params,
    locals: { runtime: { env } },
  } as unknown as APIContext;
}

const sample = {
  contract_id: 'c-submit',
  client_email: 'sam@stagelectric.test',
  client_name: 'Sam Stag',
  business_name: 'Stag Electric',
  scope_flags: { website: true, gbp: true, retainer: true },
};

async function bootstrap() {
  const env = buildEnv();
  const created = (await (
    await createIntakePost(
      ctx(env, new Request('https://x/api/intake/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': env.HMAC_SIGNING_KEY },
        body: JSON.stringify(sample),
      })),
    )
  ).json()) as { intake_id: string; token: string };
  return { env, ...created };
}

async function postSave(env: SubmitEnv, token: string, body: unknown): Promise<string> {
  const res = await savePost(
    ctx(env, new Request(`https://x/api/intake/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }), { token }),
  );
  const json = (await res.json()) as { token: string };
  return json.token;
}

async function postCredential(env: SubmitEnv, token: string, body: unknown): Promise<void> {
  await credPost(
    ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }), { token }),
  );
}

function happyRoutes(): { fetcher: typeof fetch; calls: { url: string; body?: string }[] } {
  return makeFetcher([
    {
      match: (u) => u.includes('api.notion.com'),
      respond: () => jsonResponse({ id: 'page-new-id', url: 'https://www.notion.so/page-new-id' }, 200),
    },
    {
      match: (u) => u.includes('my.1password.com'),
      respond: () => jsonResponse({ id: 'op-item-id' }, 200),
    },
    {
      match: (u) => u.includes('hooks.slack.com'),
      respond: () => new Response('ok', { status: 200 }),
    },
    {
      match: (u) => u.includes('api.resend.com'),
      respond: () => jsonResponse({ id: 'resend-msg-id' }, 200),
    },
  ]);
}

describe('POST /api/intake/[token]/submit', () => {
  it('returns 401 for an invalid token (and fires no integrations)', async () => {
    const env = buildEnv();
    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;
    const res = await submitPost(
      ctx(env, new Request('https://x/api/intake/junk/submit', { method: 'POST' }), { token: 'junk' }),
    );
    expect(res.status).toBe(401);
    expect(calls.length).toBe(0);
  });

  it('flips status, calls every integration, returns 200 with no warnings on the happy path', async () => {
    const { env, intake_id, token } = await bootstrap();
    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;

    const res = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intake: { id: string; status: string; submitted_at: number };
      warnings: unknown[];
      notion_url?: string;
    };
    expect(body.intake.id).toBe(intake_id);
    expect(body.intake.status).toBe('submitted');
    expect(typeof body.intake.submitted_at).toBe('number');
    expect(body.warnings).toEqual([]);
    expect(body.notion_url).toBe('https://www.notion.so/page-new-id');

    // Each integration was hit at least once.
    const hosts = calls.map((c) => new URL(c.url).host);
    expect(hosts).toContain('api.notion.com');
    expect(hosts).toContain('my.1password.com');
    expect(hosts).toContain('hooks.slack.com');
    expect(hosts).toContain('api.resend.com');
    // Two Resend calls: client + ops
    expect(calls.filter((c) => c.url.includes('api.resend.com')).length).toBe(2);
  });

  it('does NOT 500 when Slack is down — records a warning and still returns 200', async () => {
    const { env, token } = await bootstrap();
    const { fetcher } = makeFetcher([
      {
        match: (u) => u.includes('api.notion.com'),
        respond: () => jsonResponse({ id: 'page-id', url: 'https://www.notion.so/page-id' }),
      },
      {
        match: (u) => u.includes('my.1password.com'),
        respond: () => jsonResponse({ id: 'op-id' }),
      },
      {
        match: (u) => u.includes('hooks.slack.com'),
        respond: () => new Response('Slack is down', { status: 503 }),
      },
      {
        match: (u) => u.includes('api.resend.com'),
        respond: () => jsonResponse({ id: 'r' }),
      },
    ]);
    env.fetcher = fetcher;

    const res = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { warnings: { step: string; error: string }[] };
    expect(body.warnings.length).toBe(1);
    expect(body.warnings[0]!.step).toBe('slack');
    expect(body.warnings[0]!.error).toMatch(/503/);
  });

  it('reports multiple warnings when several integrations fail', async () => {
    const { env, token } = await bootstrap();
    const { fetcher } = makeFetcher([
      {
        match: (u) => u.includes('api.notion.com'),
        respond: () => new Response('boom', { status: 500 }),
      },
      {
        match: (u) => u.includes('my.1password.com'),
        respond: () => new Response('forbidden', { status: 403 }),
      },
      {
        match: (u) => u.includes('hooks.slack.com'),
        respond: () => new Response('ok', { status: 200 }),
      },
      {
        match: (u) => u.includes('api.resend.com'),
        respond: () => jsonResponse({ id: 'r' }),
      },
    ]);
    env.fetcher = fetcher;

    const res = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      warnings: { step: string }[];
      notion_url?: string;
    };
    const steps = body.warnings.map((w) => w.step).sort();
    expect(steps).toEqual(['notion', 'onepassword']);
    expect(body.notion_url).toBeUndefined();
  });

  it('returns 409 on a second submit and does not fire side effects again', async () => {
    const { env, token } = await bootstrap();
    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;

    const first = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(first.status).toBe(200);
    const callsAfterFirst = calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    const second = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(second.status).toBe(409);
    expect(calls.length).toBe(callsAfterFirst);
  });

  it('reads credentials from D1 (not data.step5) and includes them in the Notion + 1P payloads', async () => {
    const { env, token } = await bootstrap();
    // Write a credential via the real /credentials endpoint so it lands in D1.
    await postCredential(env, token, {
      credential_type: 'gbp',
      method: 'delegate',
      notes: 'Add intake@aeolistings.test as a Manager',
    });
    await postCredential(env, token, {
      credential_type: 'domain_registrar',
      method: 'password_manager',
    });

    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;
    const res = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(res.status).toBe(200);

    const opCall = calls.find((c) => c.url.includes('my.1password.com'));
    expect(opCall?.body).toMatch(/gbp/);
    expect(opCall?.body).toMatch(/domain_registrar/);
    // Notes should appear in the 1Password secure-note body, not Notion (which
    // only gets method-level data).
    expect(opCall?.body).toMatch(/Add intake@aeolistings\.test as a Manager/);

    const notionCall = calls.find((c) => c.url.includes('api.notion.com'));
    expect(notionCall?.body).toMatch(/gbp/);
    expect(notionCall?.body).toMatch(/domain_registrar/);
  });

  it('reads uploaded files from intake_files (not data.step3) and lists them in Notion', async () => {
    const { env, token } = await bootstrap();
    // Drop a file into intake_files via the upload endpoint.
    const fd = new FormData();
    fd.append('category', 'logo_color');
    fd.append('file', new File([new Uint8Array(128)], 'logo.svg', { type: 'image/svg+xml' }));
    const upRes = await uploadPost(
      ctx(env, new Request(`https://x/api/intake/${token}/upload`, { method: 'POST', body: fd }), { token }),
    );
    expect(upRes.status).toBe(201);

    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;
    const res = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { file_count: number };
    expect(body.file_count).toBe(1);

    const notionCall = calls.find((c) => c.url.includes('api.notion.com'));
    expect(notionCall?.body).toMatch(/logo\.svg/);
  });

  it('routes ops-channel slack notifications to SLACK_WEBHOOK_INTAKE_OPS', async () => {
    const { env, token } = await bootstrap();
    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;
    await submitPost(
      ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
    );
    const slackCalls = calls.filter((c) => c.url.includes('hooks.slack.com'));
    expect(slackCalls.length).toBe(1);
    expect(slackCalls[0]!.url).toBe(env.SLACK_WEBHOOK_INTAKE_OPS);
  });

  it('sends a client email with the magic link and an ops email with the intake_id', async () => {
    const { env, intake_id, token } = await bootstrap();
    // Save then submit. postSave rotates the token; use the new one for /submit.
    const newToken = await postSave(env, token, {
      current_step: 10,
      data: { step10: { reviewed_at: 12345 } },
    });

    const { fetcher, calls } = happyRoutes();
    env.fetcher = fetcher;
    const res = await submitPost(
      ctx(env, new Request(`https://x/api/intake/${newToken}/submit`, { method: 'POST' }), { token: newToken }),
    );
    expect(res.status).toBe(200);

    const resendCalls = calls.filter((c) => c.url.includes('api.resend.com'));
    expect(resendCalls.length).toBe(2);
    const clientCall = resendCalls.find((c) =>
      JSON.parse(c.body ?? '{}').to?.includes(sample.client_email),
    );
    const opsCall = resendCalls.find((c) => c !== clientCall);
    expect(clientCall).toBeTruthy();
    expect(opsCall).toBeTruthy();
    expect(clientCall!.body).toContain('aeolistings.test/intake/c/');
    expect(opsCall!.body).toContain(intake_id);
  });
});
