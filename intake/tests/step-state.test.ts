// Step-state helper tests — Sprint 3.
// Covers initial-state derivation per step + the applyPrefill merger.

import { describe, expect, it } from 'vitest';
import type { IntakeRecord } from '../src/lib/intake';
import type { PrefillResult } from '../src/lib/prefill';
import {
  applyPrefill,
  deriveInitialState,
  provenanceLabel,
  step1Initial,
  step2Initial,
  step3Initial,
  step4Initial,
  TOTAL_STEPS,
  SPRINT_3_FINAL_STEP,
} from '../src/lib/step-state';

function makeRecord(overrides: Partial<IntakeRecord> = {}): IntakeRecord {
  return {
    id: 'test-id',
    contract_id: 'c1',
    client_email: 'jake@example.com',
    client_name: 'Jake Beach',
    business_name: 'Aeolistings',
    scope_flags: { website: true, gbp: true, retainer: true },
    status: 'in_progress',
    current_step: 0,
    data: {},
    created_at: 0,
    updated_at: 0,
    submitted_at: null,
    ...overrides,
  };
}

describe('step1Initial', () => {
  it('seeds confirmed_scope from scope_flags when no prior data', () => {
    const r = makeRecord({ scope_flags: { website: true, gbp: false } });
    expect(step1Initial(r)).toEqual({
      confirmed_scope: { website: true, gbp: false },
      scope_notes: '',
    });
  });

  it('preserves prior step1 data when present', () => {
    const r = makeRecord({
      data: { step1: { confirmed_scope: { website: false }, scope_notes: 'hi' } },
    });
    expect(step1Initial(r).scope_notes).toBe('hi');
    expect(step1Initial(r).confirmed_scope).toEqual({ website: false });
  });
});

describe('step2Initial', () => {
  it('returns empty identity + provenance when no prior data', () => {
    const r = makeRecord();
    expect(step2Initial(r)).toEqual({ identity: {}, provenance: {}, prefill_meta: undefined });
  });

  it('preserves saved identity + provenance', () => {
    const r = makeRecord({
      data: {
        step2: {
          identity: { legal_business_name: 'Acme Co' },
          provenance: { legal_business_name: 'website' },
          prefill_meta: { last_run_at: 1234 },
        },
      },
    });
    const s = step2Initial(r);
    expect(s.identity.legal_business_name).toBe('Acme Co');
    expect(s.provenance.legal_business_name).toBe('website');
    expect(s.prefill_meta?.last_run_at).toBe(1234);
  });
});

describe('step3Initial / step4Initial', () => {
  it('returns empty objects when no prior data', () => {
    const r = makeRecord();
    expect(step3Initial(r)).toEqual({});
    expect(step4Initial(r)).toEqual({});
  });

  it('returns saved data unchanged', () => {
    const r = makeRecord({
      data: {
        step3: { colors: { primary: '#fff' } },
        step4: { testimonials: [{ name: 'Anna' }] },
      },
    });
    expect(step3Initial(r).colors?.primary).toBe('#fff');
    expect(step4Initial(r).testimonials?.[0]?.name).toBe('Anna');
  });
});

describe('deriveInitialState', () => {
  it('builds the full initial state with first-name parsing', () => {
    const r = makeRecord({ client_name: 'Jane Q. Public' });
    const state = deriveInitialState(r, 'https://intake.test/');
    expect(state.client_first_name).toBe('Jane');
    expect(state.business_name).toBe('Aeolistings');
    expect(state.total_steps).toBe(TOTAL_STEPS);
    expect(state.sprint_3_final_step).toBe(SPRINT_3_FINAL_STEP);
    expect(state.app_url).toBe('https://intake.test/');
    expect(state.current_step).toBe(0);
    expect(state.step1.confirmed_scope).toEqual(r.scope_flags);
  });

  it('clamps invalid current_step values', () => {
    expect(deriveInitialState(makeRecord({ current_step: -5 }), '').current_step).toBe(0);
    expect(deriveInitialState(makeRecord({ current_step: 999 }), '').current_step).toBe(TOTAL_STEPS);
    expect(deriveInitialState(makeRecord({ current_step: 3.7 }), '').current_step).toBe(3);
  });
});

// ----- applyPrefill --------------------------------------------------------

function makePrefill(overrides: Partial<PrefillResult> = {}): PrefillResult {
  return {
    url: 'https://acme.com/',
    domain: 'acme.com',
    fetched_at: 1700000000,
    cached: false,
    sources: { website: 'json-ld', az_roc: 'skipped', bbb: 'skipped' },
    ...overrides,
  };
}

describe('applyPrefill', () => {
  it('fills empty fields and stamps website provenance', () => {
    const out = applyPrefill(
      { identity: {}, provenance: {} },
      makePrefill({
        legal_business_name: 'Acme Roofing',
        phone_primary: '602-555-0100',
        email: 'hello@acme.com',
      }),
    );
    expect(out.identity.legal_business_name).toBe('Acme Roofing');
    expect(out.identity.phone_primary).toBe('602-555-0100');
    expect(out.provenance.legal_business_name).toBe('website');
    expect(out.provenance.phone_primary).toBe('website');
    expect(out.prefill_meta?.domain).toBe('acme.com');
    expect(out.prefill_meta?.last_run_at).toBe(1700000000);
  });

  it('does not overwrite client-edited fields', () => {
    const out = applyPrefill(
      {
        identity: { phone_primary: '480-322-7400' },
        provenance: { phone_primary: 'client' },
      },
      makePrefill({ phone_primary: '111-222-3333' }),
    );
    expect(out.identity.phone_primary).toBe('480-322-7400');
    expect(out.provenance.phone_primary).toBe('client');
  });

  it('marks scrape source distinctly from json-ld', () => {
    const out = applyPrefill(
      { identity: {}, provenance: {} },
      makePrefill({
        legal_business_name: 'Scraped Co',
        sources: { website: 'scrape', az_roc: 'skipped', bbb: 'skipped' },
      }),
    );
    expect(out.provenance.legal_business_name).toBe('website-scrape');
  });

  it('applies licenses with az-roc + bbb sources', () => {
    const out = applyPrefill(
      { identity: {}, provenance: {} },
      makePrefill({
        licenses: { roc_number: 'ROC 12345', bonded: true, insured: true, bbb_accredited_date: 'January 1, 2020' },
        sources: { website: 'json-ld', az_roc: 'hit', bbb: 'hit' },
      }),
    );
    expect(out.identity.roc_number).toBe('ROC 12345');
    expect(out.identity.bonded).toBe(true);
    expect(out.identity.bbb_accredited_date).toBe('January 1, 2020');
    expect(out.provenance.roc_number).toBe('az-roc');
    expect(out.provenance.bonded).toBe('az-roc');
    expect(out.provenance.bbb_accredited_date).toBe('bbb');
  });

  it('fills only empty address sub-fields', () => {
    const out = applyPrefill(
      { identity: { address: { city: 'Phoenix' } }, provenance: {} },
      makePrefill({ address: { city: 'Tempe', state: 'AZ', street: '123 Main' } }),
    );
    expect(out.identity.address?.city).toBe('Phoenix');
    expect(out.identity.address?.state).toBe('AZ');
    expect(out.identity.address?.street).toBe('123 Main');
  });
});

describe('provenanceLabel', () => {
  it('renders human-readable strings for each source', () => {
    expect(provenanceLabel('website')).toBe('Source: website');
    expect(provenanceLabel('website-scrape')).toBe('Source: website (scraped)');
    expect(provenanceLabel('az-roc')).toBe('Source: AZ ROC');
    expect(provenanceLabel('bbb')).toBe('Source: BBB');
    expect(provenanceLabel('client')).toBe('Edited');
    expect(provenanceLabel('unknown')).toBe('');
    expect(provenanceLabel(undefined)).toBe('');
  });
});
