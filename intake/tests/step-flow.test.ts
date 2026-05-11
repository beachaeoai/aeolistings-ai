// Sprint-3 + Sprint-4 step-flow tests:
//   · save patches the right JSON path per step (Sprints 3 + 4 cover steps 1–10)
//   · the rotated token survives a refresh (via GET resume after save)
//   · the prefill endpoint populates step-2 fields when the form would persist them
//   · Step 5 credentials endpoint upserts into intake_credentials
//   · Step 10 review/submit stub flips current_step to 10
//
// Drives the actual route handlers with a fake Cloudflare runtime.

import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { POST as createPost } from '../src/pages/api/intake/create';
import { GET as resumeGet, POST as savePost } from '../src/pages/api/intake/[token]';
import { POST as prefillPost } from '../src/pages/api/intake/[token]/prefill';
import { POST as credentialsPost } from '../src/pages/api/intake/[token]/credentials';
import { applyPrefill, step2Initial } from '../src/lib/step-state';
import { FakeD1 } from './helpers/fake-d1';
import { FakeD1Extended } from './helpers/fake-d1-extended';
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

function buildExtendedEnv(): FlowEnv & { _kv: FakeKV; _db: FakeD1Extended } {
  const _kv = new FakeKV();
  const _db = new FakeD1Extended();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    HMAC_SIGNING_KEY: 'step-flow-key-cccccccccccccccccccccc',
    APP_URL: 'https://intake.test',
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

// ---------------------------------------------------------------------------
// prefill_meta survives a subsequent Step-2 save (regression for shallow-merge trap)
// ---------------------------------------------------------------------------
//
// `updateIntakeData` shallow-merges by step key, so any PATCH that sends `step2`
// REPLACES the whole step2 namespace. If the Step-2 collector forgets to re-send
// `prefill_meta`, the "Last run: ..." hint disappears server-side on the next save.
// These tests pin down both the contract (drop happens) and the fix (re-sending
// prefill_meta preserves it).
describe('step2 prefill_meta — shallow-merge contract', () => {
  it('drops prefill_meta when a subsequent step2 PATCH omits it (contract)', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);

    // Save 1: write identity + prefill_meta (what the prefill button does).
    const r1 = await patch(env, token, {
      data: {
        step2: {
          identity: { legal_business_name: 'Acme Roofing LLC' },
          provenance: { legal_business_name: 'website' },
          prefill_meta: { last_run_at: 1700000000, domain: 'acme.com' },
        },
      },
      current_step: 2,
    });
    const { token: t2 } = (await r1.json()) as { token: string };

    // Save 2: re-send step2 WITHOUT prefill_meta (the old, buggy collectStep2 shape).
    const r2 = await patch(env, t2, {
      data: {
        step2: {
          identity: { legal_business_name: 'Acme Roofing LLC', phone_primary: '602-555-0100' },
          provenance: { legal_business_name: 'website', phone_primary: 'client' },
        },
      },
      current_step: 3,
    });
    const body = (await r2.json()) as { intake: { data: any } };
    expect(body.intake.data.step2.prefill_meta).toBeUndefined();
  });

  it('preserves prefill_meta when the collector re-sends it (fix)', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);

    const r1 = await patch(env, token, {
      data: {
        step2: {
          identity: { legal_business_name: 'Acme Roofing LLC' },
          provenance: { legal_business_name: 'website' },
          prefill_meta: { last_run_at: 1700000000, domain: 'acme.com' },
        },
      },
      current_step: 2,
    });
    const { token: t2 } = (await r1.json()) as { token: string };

    // Save 2: collectStep2 now always includes prefill_meta when state has it.
    const r2 = await patch(env, t2, {
      data: {
        step2: {
          identity: { legal_business_name: 'Acme Roofing LLC', phone_primary: '602-555-0100' },
          provenance: { legal_business_name: 'website', phone_primary: 'client' },
          prefill_meta: { last_run_at: 1700000000, domain: 'acme.com' },
        },
      },
      current_step: 3,
    });
    const body = (await r2.json()) as { intake: { data: any } };
    expect(body.intake.data.step2.prefill_meta?.last_run_at).toBe(1700000000);
    expect(body.intake.data.step2.prefill_meta?.domain).toBe('acme.com');
  });
});

// ---------------------------------------------------------------------------
// Sprint 4 — Steps 5–10 PATCH placement assertions
// ---------------------------------------------------------------------------

describe('Sprint-4 step PATCHes — JSON path placement', () => {
  it('step 5 credentials patch lands under data.step5.credentials', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step5: {
          credentials: [
            { credential_type: 'gbp', method: 'delegate' },
            { credential_type: 'domain_registrar', method: 'screen_share', notes: 'GoDaddy' },
          ],
        },
      },
      current_step: 6,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { intake: { data: any; current_step: number } };
    expect(body.intake.data.step5.credentials).toHaveLength(2);
    expect(body.intake.data.step5.credentials[0]).toEqual({ credential_type: 'gbp', method: 'delegate' });
    expect(body.intake.data.step5.credentials[1].notes).toBe('GoDaddy');
    expect(body.intake.current_step).toBe(6);
  });

  it('step 6 service-area cities land under data.step6.cities', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step6: {
          cities: [
            { name: 'Phoenix', notes: 'Lots of HOAs' },
            { name: 'Scottsdale' },
            { name: 'Wickenburg', custom: true, notes: 'Outside metro' },
          ],
        },
      },
      current_step: 7,
    });
    const body = (await res.json()) as { intake: { data: any } };
    expect(body.intake.data.step6.cities[0].name).toBe('Phoenix');
    expect(body.intake.data.step6.cities[0].notes).toBe('Lots of HOAs');
    expect(body.intake.data.step6.cities[2].custom).toBe(true);
  });

  it('step 7 voice patch lands under data.step7', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step7: {
          tone: 'expert_practical',
          voice_admire: ['Patagonia', 'Ace Hardware'],
          dont_say: 'No "world-class".',
          pricing_publishability: 'starting_at',
          warranty: { workmanship_duration: '2 years' },
        },
      },
      current_step: 8,
    });
    const body = (await res.json()) as { intake: { data: any } };
    expect(body.intake.data.step7.tone).toBe('expert_practical');
    expect(body.intake.data.step7.voice_admire).toEqual(['Patagonia', 'Ace Hardware']);
    expect(body.intake.data.step7.warranty.workmanship_duration).toBe('2 years');
  });

  it('step 8 team & approvals patch lands under data.step8', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step8: {
          primary_contact: { name: 'Pat Stag', email: 'pat@stag.test', preferred_channel: 'email' },
          backup_contact: { name: 'Sam Stag' },
          approvals: { blog_posts: 'approve_each', gbp_posts: 'auto_publish' },
          named_experts: [{ name: 'Pat Stag', title: 'Owner' }],
          default_turnaround: '2_business_days',
        },
      },
      current_step: 9,
    });
    const body = (await res.json()) as { intake: { data: any } };
    expect(body.intake.data.step8.primary_contact.email).toBe('pat@stag.test');
    expect(body.intake.data.step8.approvals.blog_posts).toBe('approve_each');
    expect(body.intake.data.step8.named_experts[0].title).toBe('Owner');
    expect(body.intake.data.step8.default_turnaround).toBe('2_business_days');
  });

  it('step 9 schedule patch lands under data.step9', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const res = await patch(env, token, {
      data: {
        step9: {
          kickoff_booked: true,
          kickoff_notes: 'Mornings preferred',
          blackout_dates: [{ start: '2026-07-01', end: '2026-07-15', notes: 'Family trip' }],
          weekly_summary_day: 'friday',
          quarterly_review: 'both',
          anything_else: 'Avoid AZ-monsoon language.',
        },
      },
      current_step: 10,
    });
    const body = (await res.json()) as { intake: { data: any; current_step: number } };
    expect(body.intake.data.step9.kickoff_booked).toBe(true);
    expect(body.intake.data.step9.blackout_dates[0].start).toBe('2026-07-01');
    expect(body.intake.data.step9.weekly_summary_day).toBe('friday');
    expect(body.intake.current_step).toBe(10);
  });

  it('step 10 submit stub records submitted_at and pins current_step at 10', async () => {
    const env = buildEnv();
    const { token } = await bootstrap(env);
    const submittedAt = 1_777_700_000;
    const res = await patch(env, token, {
      data: {
        step10: { reviewed_at: submittedAt - 60, submitted_at: submittedAt },
      },
      current_step: 10,
    });
    const body = (await res.json()) as { intake: { data: any; current_step: number } };
    expect(body.intake.data.step10.submitted_at).toBe(submittedAt);
    expect(body.intake.current_step).toBe(10);
  });

  it('preserves earlier-step data when later steps PATCH (full ladder)', async () => {
    const env = buildEnv();
    let { token } = await bootstrap(env);

    const stages: Array<[number, Record<string, unknown>]> = [
      [2, { step1: { confirmed_scope: { website: true } } }],
      [3, { step2: { identity: { legal_business_name: 'Stag Electric LLC' } } }],
      [4, { step3: { colors: { primary: '#000' } } }],
      [5, { step4: { testimonials: [{ name: 'A' }] } }],
      [6, { step5: { credentials: [{ credential_type: 'gbp', method: 'delegate' }] } }],
      [7, { step6: { cities: [{ name: 'Tempe' }] } }],
      [8, { step7: { tone: 'warm_neighborly' } }],
      [9, { step8: { default_turnaround: 'same_day' } }],
      [10, { step9: { weekly_summary_day: 'monday' } }],
      [10, { step10: { submitted_at: 1_777_700_000 } }],
    ];
    let body: any;
    for (const [next, data] of stages) {
      const res = await patch(env, token, { data, current_step: next });
      body = await res.json();
      token = body.token;
    }
    const d = body.intake.data;
    expect(d.step1.confirmed_scope.website).toBe(true);
    expect(d.step2.identity.legal_business_name).toBe('Stag Electric LLC');
    expect(d.step4.testimonials[0].name).toBe('A');
    expect(d.step5.credentials[0].credential_type).toBe('gbp');
    expect(d.step6.cities[0].name).toBe('Tempe');
    expect(d.step7.tone).toBe('warm_neighborly');
    expect(d.step8.default_turnaround).toBe('same_day');
    expect(d.step9.weekly_summary_day).toBe('monday');
    expect(d.step10.submitted_at).toBe(1_777_700_000);
  });
});

// ---------------------------------------------------------------------------
// Sprint 4 — credentials side-channel endpoint
// ---------------------------------------------------------------------------

describe('POST /api/intake/[token]/credentials — Sprint 4', () => {
  async function bootstrapExtended(env: ReturnType<typeof buildExtendedEnv>) {
    const res = await createPost(
      ctx(env, new Request('https://x/api/intake/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': env.HMAC_SIGNING_KEY },
        body: JSON.stringify(sample),
      })),
    );
    return (await res.json()) as { intake_id: string; token: string };
  }

  it('writes a credential row on first call', async () => {
    const env = buildExtendedEnv();
    const { token, intake_id } = await bootstrapExtended(env);
    const res = await credentialsPost(
      ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_type: 'gbp', method: 'delegate', notes: 'Add ops@aeolistings' }),
      }), { token }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { credential: any; credentials: any[] };
    expect(body.credential.method).toBe('delegate');
    expect(body.credentials).toHaveLength(1);
    expect(env._db.credentials.size).toBe(1);
    const row = Array.from(env._db.credentials.values())[0]!;
    expect(row.intake_id).toBe(intake_id);
    expect(row.status).toBe('pending');
  });

  it('upserts on subsequent calls with the same credential_type', async () => {
    const env = buildExtendedEnv();
    const { token } = await bootstrapExtended(env);
    await credentialsPost(
      ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_type: 'gbp', method: 'delegate' }),
      }), { token }),
    );
    const res = await credentialsPost(
      ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_type: 'gbp', method: 'screen_share', notes: 'Mon 2pm AZ' }),
      }), { token }),
    );
    const body = (await res.json()) as { credential: any; credentials: any[] };
    expect(body.credential.method).toBe('screen_share');
    expect(body.credentials).toHaveLength(1);
    expect(env._db.credentials.size).toBe(1);
  });

  it('marks skip as granted (nothing to verify)', async () => {
    const env = buildExtendedEnv();
    const { token } = await bootstrapExtended(env);
    const res = await credentialsPost(
      ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_type: 'social_tiktok', method: 'skip' }),
      }), { token }),
    );
    const body = (await res.json()) as { credential: any };
    expect(body.credential.status).toBe('granted');
    const row = Array.from(env._db.credentials.values())[0]!;
    expect(row.granted_at).not.toBeNull();
  });

  it('rejects an invalid method', async () => {
    const env = buildExtendedEnv();
    const { token } = await bootstrapExtended(env);
    const res = await credentialsPost(
      ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_type: 'gbp', method: 'NUKE_THE_SITE' }),
      }), { token }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects notes that look like a credential', async () => {
    const env = buildExtendedEnv();
    const { token } = await bootstrapExtended(env);
    const res = await credentialsPost(
      ctx(env, new Request(`https://x/api/intake/${token}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_type: 'wordpress',
          method: 'password_manager',
          notes: 'admin password: hunter2',
        }),
      }), { token }),
    );
    expect(res.status).toBe(400);
    expect(env._db.credentials.size).toBe(0);
  });

  it('rejects an invalid token', async () => {
    const env = buildExtendedEnv();
    const res = await credentialsPost(
      ctx(env, new Request('https://x/api/intake/garbage/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_type: 'gbp', method: 'delegate' }),
      }), { token: 'garbage' }),
    );
    expect(res.status).toBe(401);
  });
});
