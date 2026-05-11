// Step-data helpers — Sprints 3 + 4.
//
// The intake `data` JSON is structured by step:
//   {
//     step1: { confirmed_scope, scope_notes },
//     step2: { identity, provenance, prefill_meta },
//     step3: { logos, colors, fonts, photography },
//     step4: { testimonials, projects, press, ... },
//     step5: { credentials: [{credential_type, method, status, notes}, ...] },
//     step6: { cities: [{name, notes, custom?}], custom_cities? },
//     step7: { tone, voice_admire, dont_say, competitors, pricing, warranty },
//     step8: { primary_contact, backup_contact, approvals, named_experts, default_turnaround },
//     step9: { kickoff_booked, blackout_dates, weekly_summary_day, quarterly_review, anything_else },
//     step10: { reviewed_at?, submitted_at? },
//   }
//
// Each step's slice is namespaced so PATCHes never collide across steps.
// `deriveInitialState` collapses a record's saved data into the initial UI
// state passed to the client at render time.

import type { IntakeRecord } from './intake';
import type { PrefillResult } from './prefill';

export type StepNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const TOTAL_STEPS = 10;
export const SPRINT_3_FINAL_STEP: StepNumber = 4;
export const FINAL_STEP: StepNumber = 10;

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
// Step 5 — Digital access (credentials)
// ---------------------------------------------------------------------------
//
// Spec §5: NEVER raw passwords. We collect only the *method* by which access
// will be granted, plus optional notes. The intake_credentials D1 table is
// the system of record; the JSON slice mirrors it for the review summary.

export type CredentialMethod =
  | 'delegate'
  | 'password_manager'
  | 'screen_share'
  | 'skip'
  | '';

export type CredentialStatus = 'pending' | 'granted' | 'verified';

export interface CredentialEntry {
  credential_type: string;     // e.g. 'domain_registrar', 'gbp', 'social_facebook'
  method: CredentialMethod;
  status?: CredentialStatus;
  notes?: string;
}

export interface Step5Data {
  credentials?: CredentialEntry[];
}

export function step5Initial(record: IntakeRecord): Step5Data {
  return (record.data?.step5 as Step5Data | undefined) ?? {};
}

// Default credential categories surfaced to every client. Renderer hides ones
// the scope flags exclude (e.g. no GBP if the engagement omits Google work).
export interface CredentialCategoryDef {
  type: string;
  label: string;
  description: string;
  // If set, only show when the matching scope flag is true.
  scope?: 'website' | 'gbp' | 'retainer' | 'social_foundation' | 'social_management';
}

export const CREDENTIAL_CATEGORIES: CredentialCategoryDef[] = [
  { type: 'domain_registrar', label: 'Domain registrar',
    description: 'GoDaddy, Namecheap, Cloudflare Registrar — wherever your domain is registered.' },
  { type: 'website', label: 'Existing website / CMS',
    description: 'WordPress, Wix, Squarespace, Webflow, custom — whatever powers your current site.',
    scope: 'website' },
  { type: 'gbp', label: 'Google Business Profile',
    description: 'Add intake@aeolistings.ai as a Manager from your GBP dashboard.',
    scope: 'gbp' },
  { type: 'search_console', label: 'Google Search Console',
    description: 'Email-based access. We never need your Google password.',
    scope: 'website' },
  { type: 'analytics', label: 'Google Analytics',
    description: 'GA4 property access via the email below.',
    scope: 'website' },
  { type: 'social_facebook', label: 'Facebook (page Editor access)',
    description: 'Meta Business Suite → People → Add by email.',
    scope: 'social_management' },
  { type: 'social_instagram', label: 'Instagram',
    description: 'Linked from the same Meta Business account.',
    scope: 'social_management' },
  { type: 'social_tiktok', label: 'TikTok Business',
    description: 'Add a team member from the TikTok Business Center.',
    scope: 'social_management' },
  { type: 'social_linkedin', label: 'LinkedIn (company page)',
    description: 'Page admin invite to intake@aeolistings.ai.',
    scope: 'social_management' },
  { type: 'social_houzz', label: 'Houzz Pro',
    description: 'Houzz team-member invite.',
    scope: 'social_management' },
  { type: 'hosting_email', label: 'Hosting & email',
    description: 'cPanel / DNS / mailbox access. We may suggest migrating to Cloudflare Pages.',
    scope: 'website' },
];

// ---------------------------------------------------------------------------
// Step 6 — Service area
// ---------------------------------------------------------------------------

export interface ServiceCity {
  name: string;
  notes?: string;
  custom?: boolean;
}

export interface Step6Data {
  cities?: ServiceCity[];
}

export function step6Initial(record: IntakeRecord): Step6Data {
  return (record.data?.step6 as Step6Data | undefined) ?? {};
}

// Phoenix-metro suggested list. Clients can also add custom cities.
export const PHOENIX_METRO_CITIES = [
  'Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Gilbert',
  'Glendale', 'Peoria', 'Surprise', 'Avondale', 'Goodyear', 'Buckeye',
  'Queen Creek', 'Paradise Valley', 'Fountain Hills', 'Cave Creek',
  'Ahwatukee', 'Litchfield Park', 'Tolleson', 'Apache Junction',
];

// ---------------------------------------------------------------------------
// Step 7 — Voice & guardrails
// ---------------------------------------------------------------------------

export type ToneOption =
  | 'expert_practical'
  | 'warm_neighborly'
  | 'modern_minimal'
  | 'bold_confident'
  | 'custom'
  | '';

export type PricingPublishability =
  | 'starting_at'
  | 'full_range'
  | 'no_publish'
  | '';

export interface Step7Data {
  tone?: ToneOption;
  tone_custom?: string;
  voice_admire?: string[]; // up to 3
  dont_say?: string;
  competitor_sensitivities?: string[]; // up to 3
  pricing_publishability?: PricingPublishability;
  warranty?: {
    workmanship_duration?: string;
    material_policy?: string;
    per_service_notes?: string;
  };
}

export function step7Initial(record: IntakeRecord): Step7Data {
  return (record.data?.step7 as Step7Data | undefined) ?? {};
}

export const TONE_OPTIONS: { value: ToneOption; label: string; blurb: string }[] = [
  { value: 'expert_practical', label: 'Expert / practical',
    blurb: 'Authoritative without being stiff. Clear, fact-led, no fluff.' },
  { value: 'warm_neighborly', label: 'Warm / neighborly',
    blurb: 'Approachable and personal — first-name energy.' },
  { value: 'modern_minimal', label: 'Modern / minimal',
    blurb: 'Tight, design-forward, restrained adjectives.' },
  { value: 'bold_confident', label: 'Bold / confident',
    blurb: 'Strong claims, decisive language, premium positioning.' },
];

// ---------------------------------------------------------------------------
// Step 8 — Team & approvals
// ---------------------------------------------------------------------------

export type Channel = 'email' | 'text' | 'phone' | 'slack' | 'weekly_call' | '';

export interface ContactPerson {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  preferred_channel?: Channel;
}

export type ApprovalMode =
  | 'auto_publish'
  | 'approve_each'
  | 'approve_monthly'
  | 'approve_weekly'
  | '';

export interface ApprovalWorkflow {
  website_copy_assignee?: string;
  service_city_pages_assignee?: string;
  blog_posts?: ApprovalMode;
  gbp_posts?: ApprovalMode;
  review_responses?: ApprovalMode;
  social_posts?: ApprovalMode;
}

export interface NamedExpert {
  name?: string;
  title?: string;
  bio?: string;
  headshot?: Step3FileRef;
}

export type Turnaround = 'same_day' | '2_business_days' | '';

export interface Step8Data {
  primary_contact?: ContactPerson;
  backup_contact?: ContactPerson;
  approvals?: ApprovalWorkflow;
  named_experts?: NamedExpert[];
  default_turnaround?: Turnaround;
}

export function step8Initial(record: IntakeRecord): Step8Data {
  return (record.data?.step8 as Step8Data | undefined) ?? {};
}

// ---------------------------------------------------------------------------
// Step 9 — Schedule & logistics
// ---------------------------------------------------------------------------

export type WeeklySummaryDay = 'friday' | 'monday' | 'opt_out' | '';
export type QuarterlyReview = 'video_call' | 'written_report' | 'both' | '';

export interface BlackoutRange {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  notes?: string;
}

export interface Step9Data {
  kickoff_booked?: boolean;
  kickoff_notes?: string;
  blackout_dates?: BlackoutRange[];
  weekly_summary_day?: WeeklySummaryDay;
  quarterly_review?: QuarterlyReview;
  anything_else?: string;
}

export function step9Initial(record: IntakeRecord): Step9Data {
  return (record.data?.step9 as Step9Data | undefined) ?? {};
}

// ---------------------------------------------------------------------------
// Step 10 — Review & submit
// ---------------------------------------------------------------------------

export interface Step10Data {
  reviewed_at?: number;   // unix seconds when client clicked into review
  submitted_at?: number;  // unix seconds when client clicked Submit
}

export function step10Initial(record: IntakeRecord): Step10Data {
  return (record.data?.step10 as Step10Data | undefined) ?? {};
}

// ---------------------------------------------------------------------------
// Combined initial state passed to the form's client-side hydration
// ---------------------------------------------------------------------------

export interface FormInitialState {
  intake_id: string;
  client_first_name: string;
  client_name: string;
  client_email: string;
  business_name: string;
  scope_flags: Record<string, boolean>;
  current_step: StepNumber;
  total_steps: number;
  sprint_3_final_step: StepNumber;
  final_step: StepNumber;
  status: IntakeRecord['status'];
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
  step7: Step7Data;
  step8: Step8Data;
  step9: Step9Data;
  step10: Step10Data;
  app_url: string;
  appointment_scheduling_url: string;
}

export interface DeriveInitialStateOptions {
  appUrl: string;
  appointmentSchedulingUrl?: string;
}

export function deriveInitialState(
  record: IntakeRecord,
  appUrlOrOpts: string | DeriveInitialStateOptions,
  appointmentSchedulingUrl: string = '',
): FormInitialState {
  const opts: DeriveInitialStateOptions =
    typeof appUrlOrOpts === 'string'
      ? { appUrl: appUrlOrOpts, appointmentSchedulingUrl }
      : appUrlOrOpts;
  const firstName = record.client_name.split(' ')[0] ?? record.client_name;
  return {
    intake_id: record.id,
    client_first_name: firstName,
    client_name: record.client_name,
    client_email: record.client_email,
    business_name: record.business_name,
    scope_flags: record.scope_flags,
    current_step: clampStep(record.current_step),
    total_steps: TOTAL_STEPS,
    sprint_3_final_step: SPRINT_3_FINAL_STEP,
    final_step: FINAL_STEP,
    status: record.status,
    step1: step1Initial(record),
    step2: step2Initial(record),
    step3: step3Initial(record),
    step4: step4Initial(record),
    step5: step5Initial(record),
    step6: step6Initial(record),
    step7: step7Initial(record),
    step8: step8Initial(record),
    step9: step9Initial(record),
    step10: step10Initial(record),
    app_url: opts.appUrl,
    appointment_scheduling_url: opts.appointmentSchedulingUrl ?? '',
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
