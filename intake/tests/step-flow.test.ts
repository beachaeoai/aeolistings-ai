// Sprint-3 step-flow tests:
//   · save patches the right JSON path per step
//   · the rotated token survives a refresh (via GET resume after save)
//   · the prefill endpoint populates step-2 fields when the form would persist them
//
// Drives the actual route handlers with a fake Cloudflare runtime.

import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { POST as createPost } from '../src/pages/api/intake/create';
import { GET as resumeGet, POST as savePost } from '../src/pages/api/intake/[token]';
import { POST as prefillPost } from '../src/pages/api/intake/[token]/prefill';
import { applyPrefill, step2Initial } from '../src/lib/step-state';
import { FakeD1 } from './helpers/fake-d1';
import { FakeKV } from './helpers/fake-kv';

interface FlowEnv {
  DB: D1Database;
  INTAKE_TOKENS: KVNamespace;
  HMAC_SIGNING_KEY: string;
  APP_URL: string;
  fetcher?: typeof fetch;
}

function buildEnv(fetcher?: typeof fetch): FlowEnv & { _kv: FakeKV; _db: FakeD1 } {
  const _kv = new FakeKV();
  const _db = new FakeD1();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    HMAC_SIGNING_KEY: 'step-flow-key-cccccccccccccccccccccc',
    APP_URL: 'https://intake.test',
    fetcher,
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

const sample = {
  contract_id: 'q1',
  client_email: 'pat@stagelectric.test',
  client_name: 'Pat Stag',
  business_name: 'Stag Electric',
  scope_flags: { website: true, gbp: true, retainer: true },
};

async function bootstrap(env: FlowEnv) {
  return (await (
    await createPost(
      ctx(env, new Request('https://x/api/intake/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': env.HMAC_SIGNING_KEY },
        body: JSON.stringify(sample),
      })),
    )
  ).json()) as { intake_id: string; token: string };
}

async function patch(env: FlowEnv, token: string, body: unknown) {
  return savePost(
    ctx(env, new Request(`https://x/api/intake/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }), { token }),
  );
}

async function resume(env: FlowEnv, token: string) {
  return resumeGet(
    ctx(env, new Request(`https://x/api/intake/${token}`), { token }),
  );
}

describe('Sprint-3 step PATCHes — JSON path placement', () => {
  it('step 1 patches end up under data.step1', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: { step1: { confirmed_scope: { website: true, gbp: false }, scope_notes: 'Add SEO' } },
      current_step: 2,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { intake: { data: any; current_step: number } };
    expect(body.intake.data.step1.confirmed_scope).toEqual({ website: true, gbp: false });
    expect(body.intake.data.step1.scope_notes).toBe('Add SEO');
    expect(body.intake.current_step).toBe(2);
  });

  it('step 2 identity patches end up under data.step2.identity', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step2: {
          identity: {
            legal_business_name: 'Stag Electric LLC',
            phone_primary: '480-555-0100',
            address: { city: 'Tempe', state: 'AZ' },
          },
          provenance: { legal_business_name: 'client' },
        },
      },
      current_step: 3,
    });
    const body = (await res.json()) as { intake: { data: any } };
    expect(body.intake.data.step2.identity.legal_business_name).toBe('Stag Electric LLC');
    expect(body.intake.data.step2.identity.address).toEqual({ city: 'Tempe', state: 'AZ' });
    expect(body.intake.data.step2.provenance.legal_business_name).toBe('client');
  });

  it('step 3 brand-asset patches end up under data.step3', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step3: {
          colors: { primary: '#000000', accent: '#ff0000' },
          fonts: { primary_name: 'Inter' },
        },
      },
      current_step: 4,
    });
    const body = (await res.json()) as { intake: { data: any } };
    expect(body.intake.data.step3.colors.primary).toBe('#000000');
    expect(body.intake.data.step3.fonts.primary_name).toBe('Inter');
  });

  it('step 4 trust-signal patches end up under data.step4', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step4: {
          testimonials: [{ name: 'Anna Client', city: 'Phoenix', year: 2024 }],
          projects: [{ project_type: 'Custom home', city: 'Scottsdale' }],
        },
      },
      current_step: 5,
    });
    const body = (await res.json()) as { intake: { data: any } };
    expect(body.intake.data.step4.testimonials[0].name).toBe('Anna Client');
    expect(body.intake.data.step4.projects[0].project_type).toBe('Custom home');
  });

  it('preserves prior steps when a later step is patched (merge semantics)', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);

    const r1 = await patch(env, token, {
      data: { step1: { scope_notes: 'first' } },
      current_step: 2,
    });
    const { token: t2 } = (await r1.json()) as { token: string };

    const r2 = await patch(env, t2, {
      data: { step2: { identity: { legal_business_name: 'X Co' } } },
      current_step: 3,
    });
    const body = (await r2.json()) as { intake: { data: any } };
    expect(body.intake.data.step1.scope_notes).toBe('first');
    expect(body.intake.data.step2.identity.legal_business_name).toBe('X Co');
  });
});

describe('Rotated token survives a refresh', () => {
  it('GET /api/intake/[new-token] returns 200 after a save rotates', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const saveRes = await patch(env, token, {
      data: { step1: { confirmed_scope: { website: true } } },
      current_step: 2,
    });
    const { token: rotated } = (await saveRes.json()) as { token: string };

    // Simulate a page refresh: client navigates to /c/<rotated> and the server
    // reads the intake. Token must still be valid.
    const refresh = await resume(env, rotated);
    expect(refresh.status).toBe(200);
    const body = (await refresh.json()) as { intake: { current_step: number; data: any } };
    expect(body.intake.current_step).toBe(2);
    expect(body.intake.data.step1.confirmed_scope.website).toBe(true);

    // The pre-rotation token is now consumed.
    const pre = await resume(env, token);
    expect(pre.status).toBe(401);
  });
});

describe('Prefill button populates Step-2 fields', () => {
  it('prefill endpoint + applyPrefill yields a complete step2 slice that survives save', async () => {
    // Stub fetch to return a homepage with JSON-LD.
    const homepage = `<!doctype html>
      <html><head>
        <script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Acme Roofing',
          legalName: 'Acme Roofing LLC',
          telephone: '602-555-0100',
          email: 'hello@acme.com',
          foundingDate: '2010-04-15',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '101 Main',
            addressLocality: 'Phoenix',
            addressRegion: 'AZ',
            postalCode: '85003',
          },
        })}</script>
      </head><body>Acme Roofing</body></html>`;
    const stubFetch: typeof fetch = async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.startsWith('https://acme.com')) {
        return new Response(homepage, { status: 200, headers: { 'Content-Type': 'text/html' } });
      }
      // AZ ROC + BBB miss for this test.
      return new Response('', { status: 200 });
    };
    const env = buildEnv(stubFetch);
    const { token, intake_id } = await bootstrap(env);

    // 1. Hit the prefill endpoint as the form would.
    const pres = await prefillPost(
      ctx(env, new Request(`https://x/api/intake/${token}/prefill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://acme.com', business_name: 'Acme Roofing' }),
      }), { token }),
    );
    expect(pres.status).toBe(200);
    const presBody = (await pres.json()) as { prefill: any };
    expect(presBody.prefill.business_name).toBe('Acme Roofing');
    expect(presBody.prefill.phone_primary).toBe('602-555-0100');

    // 2. Form merges prefill into its step2 slice and saves it.
    const merged = applyPrefill(
      step2Initial({
        id: intake_id, contract_id: 'q1',
        client_email: '', client_name: '', business_name: '',
        scope_flags: {}, status: 'in_progress',
        current_step: 2, data: {},
        created_at: 0, updated_at: 0, submitted_at: null,
      }),
      presBody.prefill,
    );
    const saveRes = await patch(env, token, {
      data: { step2: merged },
      current_step: 3,
    });
    expect(saveRes.status).toBe(200);
    const saveBody = (await saveRes.json()) as { intake: { data: any }; token: string };

    // 3. Step-2 fields and provenance landed where the UI expects them.
    const step2 = saveBody.intake.data.step2;
    expect(step2.identity.legal_business_name).toBe('Acme Roofing LLC');
    expect(step2.identity.phone_primary).toBe('602-555-0100');
    expect(step2.identity.email).toBe('hello@acme.com');
    expect(step2.identity.address.city).toBe('Phoenix');
    expect(step2.provenance.legal_business_name).toBe('website');
    expect(step2.provenance.phone_primary).toBe('website');
    expect(step2.prefill_meta.domain).toBe('acme.com');
  });

  it('prefill rejects an invalid token with 401', async () => {
    const env = buildEnv();
    const res = await prefillPost(
      ctx(env, new Request('https://x/api/intake/garbage/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://acme.com' }),
      }), { token: 'garbage' }),
    );
    expect(res.status).toBe(401);
  });
});
