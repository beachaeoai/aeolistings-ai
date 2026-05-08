// Sprint 2 — Step 2 prefill.
// Covers the prefill orchestrator (lib/prefill.ts) and the API route
// (POST /api/intake/[token]/prefill) with a fake fetcher and KV.

import { describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';
import { prefillFromWebsite, normalizeUrl, domainKey } from '../src/lib/prefill';
import { POST as prefillPost } from '../src/pages/api/intake/[token]/prefill';
import { POST as createPost } from '../src/pages/api/intake/create';
import { FakeKV } from './helpers/fake-kv';
import { FakeD1 } from './helpers/fake-d1';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HTML_WITH_JSONLD = `<!doctype html>
<html><head>
<title>Stag Electric — Phoenix Master Electricians</title>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Electrician",
  "name": "Stag Electric",
  "legalName": "Stag Electric LLC",
  "alternateName": "Stag",
  "foundingDate": "2014-06-01",
  "founder": { "@type": "Person", "name": "Sam Stag" },
  "telephone": "(602) 555-0100",
  "email": "mailto:owner@stagelectric.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 N Central Ave",
    "addressLocality": "Phoenix",
    "addressRegion": "AZ",
    "postalCode": "85004",
    "addressCountry": "US"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "07:00", "closes": "18:00" }
  ]
}
</script>
</head><body>Stag Electric · Call (602) 555-0100</body></html>`;

const HTML_NO_JSONLD = `<!doctype html>
<html><head>
<title>Cruz Development | Luxury Custom Homes - Phoenix &amp; Salt Lake</title>
</head><body>
<h1>Welcome to Cruz Development</h1>
<p>Phone: (480) 555-7400</p>
<p>Sales: 602-555-2200</p>
<a href="mailto:hello@cruzdev.com">hello@cruzdev.com</a>
<script>// noise: contact-tracker@example.com</script>
</body></html>`;

const HTML_AZ_ROC_HIT = `<html><body>
<h2>Search Results</h2>
<table><tr>
  <td>Stag Electric LLC</td>
  <td>License: ROC #318274</td>
  <td>Status: Bonded · Insured</td>
</tr></table>
</body></html>`;

const HTML_AZ_ROC_MISS = `<html><body>
<h2>Search Results</h2>
<p>No matches found.</p>
</body></html>`;

const HTML_BBB_HIT = `<html><body>
<div class="profile">
  <h2>Stag Electric</h2>
  <p>BBB Accredited Since: October 12, 2018</p>
</div>
</body></html>`;

// ---------------------------------------------------------------------------
// Fake fetcher — routes by URL prefix.
// ---------------------------------------------------------------------------

interface RouteEntry {
  match: (url: string) => boolean;
  respond: (url: string) => Response | Promise<Response>;
}

function makeFetcher(routes: RouteEntry[]) {
  const calls: string[] = [];
  const fetcher = async (url: string | URL | Request, _init?: RequestInit) => {
    const u = typeof url === 'string' ? url : (url as URL | Request).toString();
    calls.push(u);
    for (const r of routes) {
      if (r.match(u)) return r.respond(u);
    }
    return new Response('not found', { status: 404 });
  };
  return { fetcher: fetcher as unknown as typeof fetch, calls };
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function buildEnv() {
  return {
    INTAKE_TOKENS: new FakeKV() as unknown as KVNamespace,
  };
}

// ---------------------------------------------------------------------------
// Unit tests — the orchestrator
// ---------------------------------------------------------------------------

describe('normalizeUrl + domainKey', () => {
  it('accepts bare hostnames + prepends https', () => {
    expect(normalizeUrl('stagelectric.com')!.toString()).toBe('https://stagelectric.com/');
  });
  it('preserves explicit protocol', () => {
    expect(normalizeUrl('http://example.com/foo')!.toString()).toBe('http://example.com/foo');
  });
  it('rejects empty / non-http schemes / garbage', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('not a url at all')).toBeNull();
  });
  it('strips www and lowercases for the cache domain', () => {
    expect(domainKey(new URL('https://WWW.Stagelectric.com'))).toBe('stagelectric.com');
  });
});

describe('prefillFromWebsite — JSON-LD path', () => {
  it('extracts business identity from a clean Organization node', async () => {
    const env = buildEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://stagelectric.com'), respond: () => htmlResponse(HTML_WITH_JSONLD) },
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_HIT) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse(HTML_BBB_HIT) },
    ]);

    const result = await prefillFromWebsite('stagelectric.com', { ...env, fetcher });
    expect(result.sources.website).toBe('json-ld');
    expect(result.business_name).toBe('Stag Electric');
    expect(result.legal_business_name).toBe('Stag Electric LLC');
    expect(result.dba).toBe('Stag');
    expect(result.founded_year).toBe(2014);
    expect(result.owner_name).toBe('Sam Stag');
    expect(result.phone_primary).toBe('(602) 555-0100');
    expect(result.email).toBe('owner@stagelectric.com');
    expect(result.address).toEqual({
      street: '123 N Central Ave',
      city: 'Phoenix',
      state: 'AZ',
      postal_code: '85004',
      country: 'US',
    });
    expect(result.hours?.Monday).toBe('07:00-18:00');
    expect(result.hours?.Friday).toBe('07:00-18:00');
  });
});

describe('prefillFromWebsite — scraping fallback', () => {
  it('extracts title + phones + email when no JSON-LD is present', async () => {
    const env = buildEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://cruzdev.com'), respond: () => htmlResponse(HTML_NO_JSONLD) },
      // AZ ROC + BBB will skip when no business name surfaces — but title parsing yields one.
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_MISS) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse('<html>nothing here</html>') },
    ]);

    const result = await prefillFromWebsite('cruzdev.com', { ...env, fetcher });
    expect(result.sources.website).toBe('scrape');
    expect(result.business_name).toBe('Cruz Development');
    expect(result.phone_primary).toBe('(480) 555-7400');
    expect(result.phone_secondary).toBe('602-555-2200');
    expect(result.email).toBe('hello@cruzdev.com');
    // Script-block emails were filtered.
    expect(result.email).not.toContain('@example.com');
  });
});

describe('prefillFromWebsite — AZ ROC lookup', () => {
  it('reports a hit with the parsed ROC number when found', async () => {
    const env = buildEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://stagelectric.com'), respond: () => htmlResponse(HTML_WITH_JSONLD) },
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_HIT) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse(HTML_BBB_HIT) },
    ]);
    const result = await prefillFromWebsite('stagelectric.com', { ...env, fetcher });
    expect(result.sources.az_roc).toBe('hit');
    expect(result.licenses?.roc_number).toBe('ROC 318274');
    expect(result.licenses?.bonded).toBe(true);
    expect(result.licenses?.insured).toBe(true);
  });

  it('reports a miss when search returns no results', async () => {
    const env = buildEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://stagelectric.com'), respond: () => htmlResponse(HTML_WITH_JSONLD) },
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_MISS) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse(HTML_BBB_HIT) },
    ]);
    const result = await prefillFromWebsite('stagelectric.com', { ...env, fetcher });
    expect(result.sources.az_roc).toBe('miss');
    expect(result.licenses?.roc_number).toBeUndefined();
  });
});

describe('prefillFromWebsite — BBB lookup', () => {
  it('parses the accreditation date when the profile is found', async () => {
    const env = buildEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://stagelectric.com'), respond: () => htmlResponse(HTML_WITH_JSONLD) },
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_MISS) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse(HTML_BBB_HIT) },
    ]);
    const result = await prefillFromWebsite('stagelectric.com', { ...env, fetcher });
    expect(result.sources.bbb).toBe('hit');
    expect(result.licenses?.bbb_accredited_date).toBe('October 12, 2018');
  });
});

describe('prefillFromWebsite — error handling', () => {
  it('returns failed status + an error string when the site is unreachable', async () => {
    const env = buildEnv();
    const fetcher = vi.fn(async () => {
      throw new Error('ENOTFOUND');
    }) as unknown as typeof fetch;

    const result = await prefillFromWebsite('https://does-not-exist.test', { ...env, fetcher });
    expect(result.sources.website).toBe('failed');
    expect(result.errors?.[0]).toMatch(/ENOTFOUND|fetch error/);
    // Errored fetches are NOT cached so we don't poison subsequent retries.
    const env2 = (env.INTAKE_TOKENS as unknown as FakeKV).size?.() ?? 0;
    expect(env2).toBe(0);
  });

  it('returns failed for an invalid URL without making a fetch', async () => {
    const env = buildEnv();
    const fetcher = vi.fn() as unknown as typeof fetch;
    const result = await prefillFromWebsite('javascript:alert(1)', { ...env, fetcher });
    expect(result.sources.website).toBe('failed');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns failed when fetch returns a 5xx', async () => {
    const env = buildEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://broken.test'), respond: () => new Response('ouch', { status: 503 }) },
    ]);
    const result = await prefillFromWebsite('https://broken.test', { ...env, fetcher });
    expect(result.sources.website).toBe('failed');
    expect(result.errors?.[0]).toContain('503');
  });
});

describe('prefillFromWebsite — caching', () => {
  it('caches successful results by domain and skips the fetcher on second call', async () => {
    const env = buildEnv();
    const { fetcher, calls } = makeFetcher([
      { match: (u) => /^https:\/\/(www\.)?stagelectric\.com/.test(u), respond: () => htmlResponse(HTML_WITH_JSONLD) },
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_MISS) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse('<html></html>') },
    ]);

    const first = await prefillFromWebsite('https://www.stagelectric.com/about', { ...env, fetcher });
    expect(first.cached).toBe(false);
    expect(first.sources.website).toBe('json-ld');
    const callsAfterFirst = calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Same domain (with or without www / different path) uses the cache.
    const second = await prefillFromWebsite('stagelectric.com', { ...env, fetcher });
    expect(second.cached).toBe(true);
    expect(second.business_name).toBe('Stag Electric');
    expect(calls.length).toBe(callsAfterFirst);
  });

  it('does NOT cache when website fetch failed', async () => {
    const env = buildEnv();
    const fetcher = vi.fn(async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;
    await prefillFromWebsite('https://busted.test', { ...env, fetcher });
    const fakeKv = env.INTAKE_TOKENS as unknown as FakeKV;
    expect(fakeKv.size()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// API route tests — POST /api/intake/[token]/prefill
// ---------------------------------------------------------------------------

interface FlowEnv {
  DB: D1Database;
  INTAKE_TOKENS: KVNamespace;
  HMAC_SIGNING_KEY: string;
  APP_URL: string;
  fetcher?: typeof fetch;
}

function buildFlowEnv(): FlowEnv & { _kv: FakeKV; _db: FakeD1 } {
  const _kv = new FakeKV();
  const _db = new FakeD1();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    HMAC_SIGNING_KEY: 'prefill-key-cccccccccccccccccccccccc',
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

async function bootstrapIntake(env: FlowEnv): Promise<{ intake_id: string; token: string }> {
  const create = await createPost(
    ctx(
      env,
      new Request('https://x/api/intake/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': env.HMAC_SIGNING_KEY,
        },
        body: JSON.stringify({
          contract_id: 'q-prefill',
          client_email: 'owner@stagelectric.test',
          client_name: 'Sam Stag',
          business_name: 'Stag Electric',
          scope_flags: { website: true },
        }),
      }),
    ),
  );
  return (await create.json()) as { intake_id: string; token: string };
}

describe('POST /api/intake/[token]/prefill', () => {
  it('returns 401 for a bad token', async () => {
    const env = buildFlowEnv();
    const res = await prefillPost(
      ctx(
        env,
        new Request('https://x/api/intake/junk/prefill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://stagelectric.com' }),
        }),
        { token: 'junk' },
      ),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for a missing url', async () => {
    const env = buildFlowEnv();
    const { token } = await bootstrapIntake(env);
    const res = await prefillPost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}/prefill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { token },
      ),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const env = buildFlowEnv();
    const { token } = await bootstrapIntake(env);
    const res = await prefillPost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}/prefill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{nope',
        }),
        { token },
      ),
    );
    expect(res.status).toBe(400);
  });

  it('returns the prefilled fields for a valid token + url', async () => {
    const env = buildFlowEnv();
    const { fetcher } = makeFetcher([
      { match: (u) => u.startsWith('https://stagelectric.com'), respond: () => htmlResponse(HTML_WITH_JSONLD) },
      { match: (u) => u.includes('azroc'), respond: () => htmlResponse(HTML_AZ_ROC_HIT) },
      { match: (u) => u.includes('bbb.org'), respond: () => htmlResponse(HTML_BBB_HIT) },
    ]);
    env.fetcher = fetcher;
    const { token } = await bootstrapIntake(env);
    const res = await prefillPost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}/prefill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'stagelectric.com' }),
        }),
        { token },
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { prefill: { business_name: string; sources: { website: string } } };
    expect(body.prefill.business_name).toBe('Stag Electric');
    expect(body.prefill.sources.website).toBe('json-ld');
  });

  it('does not rotate the token (prefill is a side-channel lookup)', async () => {
    const env = buildFlowEnv();
    env.fetcher = makeFetcher([
      { match: () => true, respond: () => htmlResponse('<html></html>') },
    ]).fetcher;
    const { token } = await bootstrapIntake(env);

    await prefillPost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}/prefill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.test' }),
        }),
        { token },
      ),
    );
    // Same token should still resolve to a valid intake (consume side-effect didn't fire).
    const res2 = await prefillPost(
      ctx(
        env,
        new Request(`https://x/api/intake/${token}/prefill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.test' }),
        }),
        { token },
      ),
    );
    expect(res2.status).toBe(200);
  });
});
