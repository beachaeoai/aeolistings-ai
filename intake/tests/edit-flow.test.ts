// Post-submit edit flow tests — Sprint 6.
//
// Drives the existing save / resume route handlers against a previously
// submitted intake. The flow:
//
//   1. submit → status='submitted'
//   2. save against submitted → status='editing' + Slack notified
//   3. save again while still 'editing' → status stays, NO duplicate Slack
//   4. resume after 24h staleness → status auto-flips back to 'submitted'
//   5. Slack down on the edit save → save still returns 200 (partial-failure
//      tolerant, same pattern as Sprint 5 submit)

import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { POST as createIntakePost } from '../src/pages/api/intake/create';
import { GET as resumeGet, POST as savePost } from '../src/pages/api/intake/[token]';
import { POST as submitPost } from '../src/pages/api/intake/[token]/submit';
import { FakeD1Extended } from './helpers/fake-d1-extended';
import { FakeKV } from './helpers/fake-kv';
import { FakeR2 } from './helpers/fake-r2';

interface EditEnv {
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
  match: (url: string) => boolean;
  respond: (url: string) => Response | Promise<Response>;
}

function makeFetcher(routes: RouteEntry[]) {
  const calls: { url: string; body?: string }[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : (url as URL | Request).toString();
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ url: u, body });
    for (const r of routes) {
      if (r.match(u)) return r.respond(u);
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

function happyRoutes() {
  return makeFetcher([
    { match: (u) => u.includes('api.notion.com'), respond: () => jsonResponse({ id: 'p', url: 'https://www.notion.so/p' }) },
    { match: (u) => u.includes('my.1password.com'), respond: () => jsonResponse({ id: 'op' }) },
    { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    { match: (u) => u.includes('api.resend.com'), respond: () => jsonResponse({ id: 'r' }) },
  ]);
}

function buildEnv(): EditEnv & { _db: FakeD1Extended; _kv: FakeKV; _r2: FakeR2 } {
  const _kv = new FakeKV();
  const _db = new FakeD1Extended();
  const _r2 = new FakeR2();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    UPLOADS: _r2 as unknown as R2Bucket,
    HMAC_SIGNING_KEY: 'edit-key-yyyyyyyyyyyyyyyyyyyyyyyy',
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

function ctx(env: EditEnv, request: Request, params: Record<string, string> = {}) {
  return {
    request,
    params,
    locals: { runtime: { env } },
  } as unknown as APIContext;
}

const sample = {
  contract_id: 'c-edit',
  client_email: 'sam@stagelectric.test',
  client_name: 'Sam Stag',
  business_name: 'Stag Electric',
  scope_flags: { website: true, gbp: true },
};

async function bootstrap(): Promise<{ env: ReturnType<typeof buildEnv>; token: string; intake_id: string }> {
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
  return { env, token: created.token, intake_id: created.intake_id };
}

async function submitOnce(env: EditEnv, token: string): Promise<void> {
  const { fetcher } = happyRoutes();
  env.fetcher = fetcher;
  const res = await submitPost(
    ctx(env, new Request(`https://x/api/intake/${token}/submit`, { method: 'POST' }), { token }),
  );
  expect(res.status).toBe(200);
}

async function postSave(env: EditEnv, token: string, body: unknown) {
  return savePost(
    ctx(env, new Request(`https://x/api/intake/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }), { token }),
  );
}

describe('Post-submit edit flow', () => {
  it('flips status submitted → editing on a save against a submitted intake AND notifies Slack', async () => {
    const { env, token } = await bootstrap();
    await submitOnce(env, token);

    // Reset fetcher to count only edit-flow Slack calls.
    const { fetcher, calls } = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    ]);
    env.fetcher = fetcher;

    // After submit, the original token is still valid (Sprint 5 doesn't rotate
    // on submit). Use it to save an edit.
    const res = await postSave(env, token, { data: { step7: { dont_say: 'updated copy' } } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { intake: { status: string }; warnings: unknown[] };
    expect(body.intake.status).toBe('editing');
    expect(body.warnings).toEqual([]);
    const slackCalls = calls.filter((c) => c.url.includes('hooks.slack.com'));
    expect(slackCalls.length).toBe(1);
    expect(slackCalls[0]!.body).toMatch(/Stag Electric/);
    expect(slackCalls[0]!.body).toMatch(/step7/);
  });

  it('does NOT re-notify Slack when a second edit comes in while still editing', async () => {
    const { env, token } = await bootstrap();
    await submitOnce(env, token);

    // First edit — flips to editing + notifies.
    const slackOnly = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    ]);
    env.fetcher = slackOnly.fetcher;
    const first = await postSave(env, token, { data: { step7: { dont_say: 'one' } } });
    const newToken = ((await first.json()) as { token: string }).token;

    expect(slackOnly.calls.filter((c) => c.url.includes('hooks.slack.com')).length).toBe(1);

    // Second edit — still 'editing'; should NOT call Slack again.
    const second = await postSave(env, newToken, { data: { step7: { dont_say: 'two' } } });
    expect(second.status).toBe(200);
    const body = (await second.json()) as { intake: { status: string } };
    expect(body.intake.status).toBe('editing');
    expect(slackOnly.calls.filter((c) => c.url.includes('hooks.slack.com')).length).toBe(1);
  });

  it('does NOT 500 the save when Slack is down — captures a warning instead', async () => {
    const { env, token } = await bootstrap();
    await submitOnce(env, token);

    const downSlack = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('boom', { status: 503 }) },
    ]);
    env.fetcher = downSlack.fetcher;

    const res = await postSave(env, token, { data: { step7: { dont_say: 'x' } } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { intake: { status: string }; warnings: { step: string }[] };
    expect(body.intake.status).toBe('editing');
    expect(body.warnings.length).toBe(1);
    expect(body.warnings[0]!.step).toBe('slack');
  });

  it('does NOT flip status when the save is against an in_progress intake', async () => {
    const { env, token } = await bootstrap();
    const slackOnly = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    ]);
    env.fetcher = slackOnly.fetcher;

    const res = await postSave(env, token, {
      data: { step1: { confirmed_scope: { website: true } } },
      current_step: 1,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { intake: { status: string } };
    expect(body.intake.status).toBe('in_progress');
    expect(slackOnly.calls.length).toBe(0);
  });

  it("describes the edited step in the Slack message ('step10' when only current_step changes)", async () => {
    const { env, token } = await bootstrap();
    await submitOnce(env, token);

    const slackOnly = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    ]);
    env.fetcher = slackOnly.fetcher;

    // No data, just step nav — describeEditedStep should fall back to "step N".
    await postSave(env, token, { current_step: 7 });
    const slack = slackOnly.calls.find((c) => c.url.includes('hooks.slack.com'))!;
    expect(slack.body).toMatch(/step 7/);
  });

  it('GET resume auto-reconciles editing → submitted after 24h of inactivity', async () => {
    const { env, token } = await bootstrap();
    await submitOnce(env, token);

    // Edit so status flips to 'editing'.
    const slackOnly = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    ]);
    env.fetcher = slackOnly.fetcher;
    const saved = await postSave(env, token, { data: { step7: { dont_say: 'x' } } });
    const newToken = ((await saved.json()) as { token: string }).token;

    // Hand-edit updated_at to 25h ago so the reconcile fires on the next GET.
    const intake_id = bootstrappedId(env);
    const row = env._db.records.get(intake_id)!;
    env._db.records.set(intake_id, {
      ...row,
      updated_at: row.updated_at - 25 * 60 * 60,
    });
    expect(env._db.records.get(intake_id)!.status).toBe('editing');

    const get = await resumeGet(
      ctx(env, new Request(`https://x/api/intake/${newToken}`), { token: newToken }),
    );
    expect(get.status).toBe(200);
    const body = (await get.json()) as { intake: { status: string } };
    expect(body.intake.status).toBe('submitted');
    // The reconcile also persists, so the next read sees submitted too.
    expect(env._db.records.get(intake_id)!.status).toBe('submitted');
  });

  it('GET resume does NOT reconcile when the edit is still recent', async () => {
    const { env, token } = await bootstrap();
    await submitOnce(env, token);

    const slackOnly = makeFetcher([
      { match: (u) => u.includes('hooks.slack.com'), respond: () => new Response('ok') },
    ]);
    env.fetcher = slackOnly.fetcher;
    const saved = await postSave(env, token, { data: { step7: { dont_say: 'x' } } });
    const newToken = ((await saved.json()) as { token: string }).token;

    const get = await resumeGet(
      ctx(env, new Request(`https://x/api/intake/${newToken}`), { token: newToken }),
    );
    expect(get.status).toBe(200);
    const body = (await get.json()) as { intake: { status: string } };
    expect(body.intake.status).toBe('editing');
  });
});

function bootstrappedId(env: ReturnType<typeof buildEnv>): string {
  // There's exactly one intake row in the fake D1 after bootstrap().
  return [...env._db.records.keys()][0]!;
}
