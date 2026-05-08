// Step-data helpers — Sprint 3.
//
// The intake `data` JSON is structured by step:
//   {
//     step1: { confirmed_scope: {...}, scope_notes },
//     step2: { business_identity: {...}, prefill_meta: {...} },
//     step3: { brand_assets: {...} },
//     step4: { trust_signals: {...} },
//     ...
//   }
//
// Each step's slice is namespaced so PATCHes never collide across steps,
// and so future Claude can ship Sprint 4's steps 5–10 by adding a
// `step5`/`step6`/... key without touching prior data.
//
// `deriveStepInitialState` collapses a record's saved data into the
// initial UI state passed to the client at render time.

import type { IntakeRecord } from './intake';
import type { PrefillResult } from './prefill';

export type StepNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const TOTAL_STEPS = 10;
export const SPRINT_3_FINAL_STEP: StepNumber = 4;

// ---------------------------------------------------------------------------
// Step 1 — Confirm scope
// ---------------------------------------------------------------------------

export interface Step1Data {
  confirmed_scope?: Record<string, boolean>;
  scope_notes?: string;
}

export function step1Initial(record: IntakeRecord): Step1Data {
  const slice = (record.data?.step1 as Step1Data | undefined) ?? {};
  return {
    confirmed_scope: slice.confirmed_scope ?? { ...record.scope_flags },
    scope_notes: slice.scope_notes ?? '',
  };
}

// ---------------------------------------------------------------------------
// Step 2 — Business identity
// ---------------------------------------------------------------------------

export interface Step2Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface Step2Identity {
  legal_business_name?: string;
  dba?: string;
  founded_year?: number | string;
  owner_name?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  address?: Step2Address;
  hours?: string;
  roc_number?: string;
  bonded?: boolean;
  insured?: boolean;
  bbb_accredited_date?: string;
  industry_associations?: string[];
  manufacturer_certifications?: string[];
  website_url?: string;
}

export type ProvenanceSource =
  | 'website'
  | 'website-scrape'
  | 'az-roc'
  | 'bbb'
  | 'client'
  | 'unknown';

export interface Step2Data {
  identity: Step2Identity;
  // Per-field provenance label so the client knows what was guessed.
  provenance: Partial<Record<keyof Step2Identity, ProvenanceSource>>;
  prefill_meta?: {
    last_run_at?: number;
    domain?: string;
    sources?: PrefillResult['sources'];
    cached?: boolean;
    errors?: string[];
  };
}

export function step2Initial(record: IntakeRecord): Step2Data {
  const slice = (record.data?.step2 as Step2Data | undefined) ?? {
    identity: {},
    provenance: {},
  };
  return {
    identity: slice.identity ?? {},
    provenance: slice.provenance ?? {},
    prefill_meta: slice.prefill_meta,
  };
}

/**
 * Merge a PrefillResult into a Step2Data slice.
 * Existing client-edited values win — we only fill empty fields, then stamp
 * provenance for those filled. Returns a fresh slice; never mutates.
 */
export function applyPrefill(
  current: Step2Data,
  prefill: PrefillResult,
): Step2Data {
  const ident: Step2Identity = { ...current.identity };
  const prov: Step2Data['provenance'] = { ...current.provenance };

  const websiteSource: ProvenanceSource =
    prefill.sources.website === 'json-ld'
      ? 'website'
      : prefill.sources.website === 'scrape'
        ? 'website-scrape'
        : 'unknown';

  const setIfEmpty = <K extends keyof Step2Identity>(
    key: K,
    value: Step2Identity[K] | undefined,
    source: ProvenanceSource,
  ): void => {
    if (value === undefined || value === null || value === '') return;
    if (ident[key] !== undefined && ident[key] !== '' && ident[key] !== null) return;
    ident[key] = value;
    prov[key] = source;
  };

  setIfEmpty('legal_business_name', prefill.legal_business_name ?? prefill.business_name, websiteSource);
  setIfEmpty('dba', prefill.dba, websiteSource);
  setIfEmpty('founded_year', prefill.founded_year, websiteSource);
  setIfEmpty('owner_name', prefill.owner_name, websiteSource);
  setIfEmpty('phone_primary', prefill.phone_primary, websiteSource);
  setIfEmpty('phone_secondary', prefill.phone_secondary, websiteSource);
  setIfEmpty('email', prefill.email, websiteSource);

  if (prefill.address) {
    const addr: Step2Address = { ...(ident.address ?? {}) };
    let touched = false;
    for (const k of ['street', 'city', 'state', 'postal_code', 'country'] as const) {
      const v = prefill.address[k];
      if (v && (addr[k] === undefined || addr[k] === '')) {
        addr[k] = v;
        touched = true;
      }
    }
    if (touched && (ident.address === undefined || Object.keys(ident.address).length === 0)) {
      ident.address = addr;
      prov.address = websiteSource;
    } else if (touched) {
      ident.address = addr;
    }
  }

  if (prefill.licenses) {
    setIfEmpty('roc_number', prefill.licenses.roc_number, 'az-roc');
    if (prefill.licenses.bonded !== undefined && ident.bonded === undefined) {
      ident.bonded = prefill.licenses.bonded;
      prov.bonded = 'az-roc';
    }
    if (prefill.licenses.insured !== undefined && ident.insured === undefined) {
      ident.insured = prefill.licenses.insured;
      prov.insured = 'az-roc';
    }
    setIfEmpty('bbb_accredited_date', prefill.licenses.bbb_accredited_date, 'bbb');
  }

  return {
    identity: ident,
    provenance: prov,
    prefill_meta: {
      last_run_at: prefill.fetched_at,
      domain: prefill.domain,
      sources: prefill.sources,
      cached: prefill.cached,
      errors: prefill.errors,
    },
  };
}

// ---------------------------------------------------------------------------
// Step 3 — Brand assets
// ---------------------------------------------------------------------------

export interface Step3FileRef {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string;
}

export interface Step3Data {
  logos?: {
    color?: Step3FileRef;
    white?: Step3FileRef;
    favicon?: Step3FileRef;
  };
  colors?: {
    primary?: string;
    accent?: string;
    background?: string;
    designer_choice?: boolean;
  };
  fonts?: {
    primary_name?: string;
    secondary_name?: string;
    designer_choice?: boolean;
    uploads?: Step3FileRef[];
  };
  photography?: {
    items?: (Step3FileRef & { category?: string })[];
    photoshoot_requested?: boolean;
  };
}

export function step3Initial(record: IntakeRecord): Step3Data {
  return (record.data?.step3 as Step3Data | undefined) ?? {};
}

// ---------------------------------------------------------------------------
// Step 4 — Trust signals
// ---------------------------------------------------------------------------

export interface Testimonial {
  name?: string;
  project_type?: string;
  city?: string;
  year?: string | number;
  quote?: string;
  permission_to_publish?: boolean;
}

export interface Project {
  project_type?: string;
  city?: string;
  scope?: string; // e.g. "3,200 sqft remodel"
  timeline?: string;
  year?: string | number;
  budget_range?: string;
  publishable_budget?: boolean;
  notes?: string;
  photos?: Step3FileRef[];
}

export interface Press {
  title?: string;
  url?: string;
  date?: string;
}

export interface Step4Data {
  testimonials?: Testimonial[];
  external_review_imports?: string[];
  projects?: Project[];
  press?: Press[];
}

export function step4Initial(record: IntakeRecord): Step4Data {
  return (record.data?.step4 as Step4Data | undefined) ?? {};
}

// ---------------------------------------------------------------------------
// Combined initial state passed to the form's client-side hydration
// ---------------------------------------------------------------------------

export interface FormInitialState {
  intake_id: string;
  client_first_name: string;
  client_name: string;
  business_name: string;
  scope_flags: Record<string, boolean>;
  current_step: StepNumber;
  total_steps: number;
  sprint_3_final_step: StepNumber;
  status: IntakeRecord['status'];
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  app_url: string;
}

export function deriveInitialState(
  record: IntakeRecord,
  appUrl: string,
): FormInitialState {
  const firstName = record.client_name.split(' ')[0] ?? record.client_name;
  return {
    intake_id: record.id,
    client_first_name: firstName,
    client_name: record.client_name,
    business_name: record.business_name,
    scope_flags: record.scope_flags,
    current_step: clampStep(record.current_step),
    total_steps: TOTAL_STEPS,
    sprint_3_final_step: SPRINT_3_FINAL_STEP,
    status: record.status,
    step1: step1Initial(record),
    step2: step2Initial(record),
    step3: step3Initial(record),
    step4: step4Initial(record),
    app_url: appUrl,
  };
}

function clampStep(n: number): StepNumber {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > TOTAL_STEPS) return TOTAL_STEPS as StepNumber;
  return Math.floor(n) as StepNumber;
}

// ---------------------------------------------------------------------------
// Provenance label rendering
// ---------------------------------------------------------------------------

export function provenanceLabel(source: ProvenanceSource | undefined): string {
  switch (source) {
    case 'website':
      return 'Source: website';
    case 'website-scrape':
      return 'Source: website (scraped)';
    case 'az-roc':
      return 'Source: AZ ROC';
    case 'bbb':
      return 'Source: BBB';
    case 'client':
      return 'Edited';
    default:
      return '';
  }
}
