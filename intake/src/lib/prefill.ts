// Step 2 prefill — Sprint 2.
//
// Given a website URL, infer the Step 2 "business identity" fields by:
//   1. Crawling the homepage server-side (Cloudflare fetch, no client scraping)
//   2. Extracting JSON-LD `Organization` / `LocalBusiness` data when present
//   3. Falling back to lightweight HTML/regex scraping when JSON-LD is missing
//   4. Cross-referencing AZ ROC (license #) + BBB (accreditation date) by name
//   5. Caching the merged result in KV keyed by domain (24-hour TTL)
//
// The client confirms / edits everything in the form — this module is a
// best-effort prefill, never a source of truth.
//
// Notes for future sprints:
//   - AZ ROC / BBB are scraped against their public search pages. Both are
//     fragile (Salesforce + dynamic content). Per spec §14, accept fallback
//     to scraping until proper API access is granted. Failures degrade
//     silently to `miss` / `failed` sources so the form still loads.
//   - The cache uses the existing INTAKE_TOKENS KV namespace with a
//     `prefill:` prefix to avoid adding a second binding for a single feature.

export interface PrefillEnv {
  INTAKE_TOKENS: KVNamespace;
  // Optional fetcher override — tests inject a fake; production uses globalThis.fetch.
  fetcher?: typeof fetch;
}

export interface PrefillAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface PrefillLicenses {
  roc_number?: string;
  bonded?: boolean;
  insured?: boolean;
  bbb_accredited_date?: string;
}

export type WebsiteSource = 'json-ld' | 'scrape' | 'failed';
export type LookupSource = 'hit' | 'miss' | 'failed' | 'skipped';

export interface PrefillResult {
  url: string;
  domain: string;
  fetched_at: number;
  cached: boolean;
  business_name?: string;
  legal_business_name?: string;
  dba?: string;
  founded_year?: number;
  owner_name?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  address?: PrefillAddress;
  hours?: Record<string, string>;
  licenses?: PrefillLicenses;
  industry_associations?: string[];
  manufacturer_certifications?: string[];
  sources: {
    website: WebsiteSource;
    az_roc: LookupSource;
    bbb: LookupSource;
  };
  errors?: string[];
}

export interface PrefillOptions {
  businessName?: string;
  useCache?: boolean;
  // Override TTL in tests; defaults to 24h.
  cacheTtlSeconds?: number;
  // Per-fetch timeout. Defaults to 8s — Workers have a 30s wall-clock budget.
  fetchTimeoutMs?: number;
}

const DEFAULT_CACHE_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT =
  'AeolistingsIntakeBot/1.0 (+https://aeolistings.ai/intake/about-bot)';

// ---------------------------------------------------------------------------
// URL normalization + domain extraction
// ---------------------------------------------------------------------------

export function normalizeUrl(input: string): URL | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

export function domainKey(url: URL): string {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function cacheKey(domain: string): string {
  return `prefill:${domain}`;
}

async function readCache(
  domain: string,
  env: PrefillEnv,
): Promise<PrefillResult | null> {
  const raw = await env.INTAKE_TOKENS.get<PrefillResult>(cacheKey(domain), 'json');
  return raw ?? null;
}

async function writeCache(
  domain: string,
  value: PrefillResult,
  env: PrefillEnv,
  ttlSeconds: number,
): Promise<void> {
  await env.INTAKE_TOKENS.put(cacheKey(domain), JSON.stringify(value), {
    expirationTtl: Math.max(60, ttlSeconds),
  });
}

// ---------------------------------------------------------------------------
// Fetch with timeout — relies on AbortController; works under Workers.
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  env: PrefillEnv,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const f = env.fetcher ?? globalThis.fetch;
    return await f(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// JSON-LD extraction
// ---------------------------------------------------------------------------

const JSON_LD_RE =
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

interface RawJsonLdNode {
  '@type'?: string | string[];
  '@graph'?: RawJsonLdNode[];
  [k: string]: unknown;
}

function parseJsonLdBlocks(html: string): RawJsonLdNode[] {
  const nodes: RawJsonLdNode[] = [];
  let match: RegExpExecArray | null;
  while ((match = JSON_LD_RE.exec(html))) {
    const raw = (match[1] ?? '').trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) nodes.push(...parsed);
      else nodes.push(parsed);
    } catch {
      // Malformed JSON-LD blocks are common in the wild — skip silently.
    }
  }
  // Flatten @graph wrappers.
  const flat: RawJsonLdNode[] = [];
  for (const n of nodes) {
    if (Array.isArray(n['@graph'])) flat.push(...n['@graph']);
    else flat.push(n);
  }
  return flat;
}

const ORG_TYPES = new Set([
  'Organization',
  'Corporation',
  'LocalBusiness',
  'HomeAndConstructionBusiness',
  'Electrician',
  'Plumber',
  'RoofingContractor',
  'GeneralContractor',
  'HVACBusiness',
  'HousePainter',
  'Locksmith',
  'MovingCompany',
  'ProfessionalService',
]);

function nodeIsOrg(node: RawJsonLdNode): boolean {
  const t = node['@type'];
  if (typeof t === 'string') return ORG_TYPES.has(t);
  if (Array.isArray(t)) return t.some((x) => typeof x === 'string' && ORG_TYPES.has(x));
  return false;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed || undefined;
  }
  return undefined;
}

function asYear(v: unknown): number | undefined {
  const s = asString(v);
  if (!s) return undefined;
  const m = s.match(/(\d{4})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1800 || y > new Date().getFullYear() + 1) return undefined;
  return y;
}

interface PostalAddressLike {
  streetAddress?: unknown;
  addressLocality?: unknown;
  addressRegion?: unknown;
  postalCode?: unknown;
  addressCountry?: unknown | { name?: unknown };
}

function parsePostalAddress(v: unknown): PrefillAddress | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const a = v as PostalAddressLike;
  let country: string | undefined;
  if (typeof a.addressCountry === 'string') country = asString(a.addressCountry);
  else if (a.addressCountry && typeof a.addressCountry === 'object') {
    country = asString((a.addressCountry as { name?: unknown }).name);
  }
  const out: PrefillAddress = {
    street: asString(a.streetAddress),
    city: asString(a.addressLocality),
    state: asString(a.addressRegion),
    postal_code: asString(a.postalCode),
    country,
  };
  return Object.values(out).some(Boolean) ? out : undefined;
}

interface OpeningHoursSpec {
  dayOfWeek?: unknown;
  opens?: unknown;
  closes?: unknown;
}

function parseOpeningHours(v: unknown): Record<string, string> | undefined {
  if (!v) return undefined;
  const list = Array.isArray(v) ? v : [v];
  const out: Record<string, string> = {};
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as OpeningHoursSpec;
    const days = Array.isArray(e.dayOfWeek) ? e.dayOfWeek : [e.dayOfWeek];
    const opens = asString(e.opens);
    const closes = asString(e.closes);
    if (!opens || !closes) continue;
    for (const d of days) {
      const day = asString(d)?.replace(/^https?:\/\/schema\.org\//, '');
      if (day) out[day] = `${opens}-${closes}`;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function parseFounder(v: unknown): string | undefined {
  if (!v) return undefined;
  const list = Array.isArray(v) ? v : [v];
  for (const entry of list) {
    if (typeof entry === 'string') return entry.trim() || undefined;
    if (entry && typeof entry === 'object') {
      const name = asString((entry as { name?: unknown }).name);
      if (name) return name;
    }
  }
  return undefined;
}

function applyJsonLdNode(node: RawJsonLdNode, into: PrefillResult): void {
  into.business_name ??= asString(node.name);
  into.legal_business_name ??= asString(node.legalName) ?? into.business_name;
  const alt = asString(node.alternateName);
  if (alt && alt !== into.business_name) into.dba ??= alt;

  into.founded_year ??= asYear(node.foundingDate);
  into.owner_name ??= parseFounder(node.founder);

  // Telephone may be a single value or an array of ContactPoint entries.
  if (typeof node.telephone === 'string') {
    into.phone_primary ??= asString(node.telephone);
  } else if (Array.isArray(node.contactPoint)) {
    for (const cp of node.contactPoint) {
      if (cp && typeof cp === 'object') {
        const phone = asString((cp as { telephone?: unknown }).telephone);
        if (phone && !into.phone_primary) into.phone_primary = phone;
        else if (phone && !into.phone_secondary && phone !== into.phone_primary)
          into.phone_secondary = phone;
      }
    }
  }

  into.email ??= asString(node.email)?.replace(/^mailto:/i, '');
  into.address ??= parsePostalAddress(node.address);
  into.hours ??= parseOpeningHours(node.openingHoursSpecification);
}

// ---------------------------------------------------------------------------
// HTML scraping fallback (no JSON-LD)
// ---------------------------------------------------------------------------

const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const PHONE_RE =
  /(\+?1[\s\-.]?)?\(?\b\d{3}\)?[\s\-.]\d{3}[\s\-.]\d{4}\b/g;
const EMAIL_RE =
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;

// Strip script + style content before regex-scanning the body.
function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
}

function applyScrape(html: string, into: PrefillResult): void {
  const cleaned = stripScriptsAndStyles(html);
  if (!into.business_name) {
    const titleMatch = TITLE_RE.exec(cleaned);
    const title = asString(titleMatch?.[1]);
    if (title) {
      // Trim common "| City | Service" suffixes.
      into.business_name = title.split(/[|\-–—]/)[0]?.trim() || title;
    }
  }
  if (!into.phone_primary) {
    const phones = Array.from(cleaned.matchAll(PHONE_RE), (m) => m[0].trim());
    const unique = Array.from(new Set(phones));
    if (unique[0]) into.phone_primary = unique[0];
    if (unique[1]) into.phone_secondary ??= unique[1];
  }
  if (!into.email) {
    const emails = Array.from(cleaned.matchAll(EMAIL_RE), (m) => m[0]);
    // Skip image-tracking + obvious noise.
    const filtered = emails.filter(
      (e) => !/(sentry|wixpress|@example\.|@2x|@3x)/i.test(e),
    );
    if (filtered[0]) into.email = filtered[0];
  }
}

// ---------------------------------------------------------------------------
// AZ ROC + BBB lookups (best-effort scrapes; degrade gracefully on miss)
// ---------------------------------------------------------------------------

const AZ_ROC_SEARCH_URL = 'https://azroc.my.site.com/AZRoc/s/contractor-search';
const BBB_SEARCH_URL = 'https://www.bbb.org/search';

const ROC_NUMBER_RE = /\bROC[\s\-]?#?\s*(\d{5,7})\b/i;

export interface AzRocLookup {
  source: LookupSource;
  roc_number?: string;
  bonded?: boolean;
  insured?: boolean;
}

export async function lookupAzRoc(
  businessName: string | undefined,
  env: PrefillEnv,
  timeoutMs: number,
): Promise<AzRocLookup> {
  if (!businessName) return { source: 'skipped' };
  const url = `${AZ_ROC_SEARCH_URL}?searchTerm=${encodeURIComponent(businessName)}`;
  try {
    const res = await fetchWithTimeout(url, env, timeoutMs);
    if (!res.ok) return { source: 'failed' };
    const html = await res.text();
    const m = ROC_NUMBER_RE.exec(html);
    if (!m) return { source: 'miss' };
    return {
      source: 'hit',
      roc_number: `ROC ${m[1]}`,
      bonded: /bonded/i.test(html),
      insured: /insured/i.test(html),
    };
  } catch {
    return { source: 'failed' };
  }
}

export interface BbbLookup {
  source: LookupSource;
  bbb_accredited_date?: string;
}

const BBB_DATE_RE =
  /accredited\s+since[:\s]+([A-Z][a-z]+\s+\d{1,2},\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i;

export async function lookupBbb(
  businessName: string | undefined,
  city: string | undefined,
  env: PrefillEnv,
  timeoutMs: number,
): Promise<BbbLookup> {
  if (!businessName) return { source: 'skipped' };
  const params = new URLSearchParams();
  params.set('find_text', businessName);
  if (city) params.set('find_loc', city);
  const url = `${BBB_SEARCH_URL}?${params.toString()}`;
  try {
    const res = await fetchWithTimeout(url, env, timeoutMs);
    if (!res.ok) return { source: 'failed' };
    const html = await res.text();
    if (!/accredited/i.test(html)) return { source: 'miss' };
    const m = BBB_DATE_RE.exec(html);
    return {
      source: 'hit',
      bbb_accredited_date: m?.[1],
    };
  } catch {
    return { source: 'failed' };
  }
}

// ---------------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------------

export async function prefillFromWebsite(
  rawUrl: string,
  env: PrefillEnv,
  options: PrefillOptions = {},
): Promise<PrefillResult> {
  const useCache = options.useCache !== false;
  const cacheTtl = options.cacheTtlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;
  const fetchTimeout = options.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;

  const url = normalizeUrl(rawUrl);
  if (!url) {
    return {
      url: rawUrl,
      domain: '',
      fetched_at: Math.floor(Date.now() / 1000),
      cached: false,
      sources: { website: 'failed', az_roc: 'skipped', bbb: 'skipped' },
      errors: ['invalid url'],
    };
  }

  const domain = domainKey(url);

  if (useCache) {
    const hit = await readCache(domain, env);
    if (hit) return { ...hit, cached: true };
  }

  const result: PrefillResult = {
    url: url.toString(),
    domain,
    fetched_at: Math.floor(Date.now() / 1000),
    cached: false,
    sources: { website: 'failed', az_roc: 'skipped', bbb: 'skipped' },
  };
  const errors: string[] = [];

  // 1. Crawl the homepage.
  let html: string | null = null;
  try {
    const res = await fetchWithTimeout(url.toString(), env, fetchTimeout);
    if (!res.ok) {
      errors.push(`fetch ${res.status}`);
    } else {
      html = await res.text();
    }
  } catch (err) {
    errors.push(`fetch error: ${(err as Error).message ?? 'unknown'}`);
  }

  // 2. Parse JSON-LD if present, else fall back to scrape.
  if (html) {
    const nodes = parseJsonLdBlocks(html).filter(nodeIsOrg);
    if (nodes.length > 0) {
      for (const node of nodes) applyJsonLdNode(node, result);
      result.sources.website = 'json-ld';
    }
    // Always run scrape too — fills gaps (e.g. JSON-LD without phone).
    applyScrape(html, result);
    if (result.sources.website !== 'json-ld') {
      result.sources.website = 'scrape';
    }
  }

  // 3. AZ ROC + BBB cross-reference.
  const businessName = options.businessName ?? result.business_name;
  if (businessName) {
    const [roc, bbb] = await Promise.all([
      lookupAzRoc(businessName, env, fetchTimeout),
      lookupBbb(businessName, result.address?.city, env, fetchTimeout),
    ]);
    result.sources.az_roc = roc.source;
    result.sources.bbb = bbb.source;
    if (roc.source === 'hit') {
      result.licenses = {
        ...(result.licenses ?? {}),
        roc_number: roc.roc_number,
        bonded: roc.bonded,
        insured: roc.insured,
      };
    }
    if (bbb.source === 'hit' && bbb.bbb_accredited_date) {
      result.licenses = {
        ...(result.licenses ?? {}),
        bbb_accredited_date: bbb.bbb_accredited_date,
      };
    }
  }

  if (errors.length) result.errors = errors;

  if (useCache && result.sources.website !== 'failed') {
    await writeCache(domain, result, env, cacheTtl);
  }

  return result;
}
