// Intake-record DB helpers — Sprint 1.
// Field shape mirrors migrations/0001_initial.sql.

// ulidx is the maintained fork of `ulid`. The original falls back to
// `require("crypto")` when window is undefined, which throws under
// Cloudflare Workers and 500s every route that imports this module.
import { ulid } from 'ulidx';

export type IntakeStatus = 'in_progress' | 'submitted' | 'editing';

export interface IntakeRecord {
  id: string;
  contract_id: string;
  client_email: string;
  client_name: string;
  business_name: string;
  scope_flags: Record<string, boolean>;
  status: IntakeStatus;
  current_step: number;
  data: Record<string, unknown>;
  created_at: number;
  updated_at: number;
  submitted_at: number | null;
}

export interface CreateIntakeInput {
  contract_id: string;
  client_email: string;
  client_name: string;
  business_name: string;
  scope_flags: Record<string, boolean>;
}

export interface IntakeEnv {
  DB: D1Database;
}

interface IntakeRow {
  id: string;
  contract_id: string;
  client_email: string;
  client_name: string;
  business_name: string;
  scope_flags: string;
  status: IntakeStatus;
  current_step: number;
  data: string;
  created_at: number;
  updated_at: number;
  submitted_at: number | null;
}

function rowToRecord(row: IntakeRow): IntakeRecord {
  return {
    ...row,
    scope_flags: JSON.parse(row.scope_flags),
    data: JSON.parse(row.data),
  };
}

export async function createIntake(
  input: CreateIntakeInput,
  env: IntakeEnv,
): Promise<IntakeRecord> {
  const now = Math.floor(Date.now() / 1000);
  const record: IntakeRecord = {
    id: ulid(),
    contract_id: input.contract_id,
    client_email: input.client_email,
    client_name: input.client_name,
    business_name: input.business_name,
    scope_flags: input.scope_flags,
    status: 'in_progress',
    current_step: 0,
    data: {},
    created_at: now,
    updated_at: now,
    submitted_at: null,
  };

  await env.DB.prepare(
    `INSERT INTO intake_records
       (id, contract_id, client_email, client_name, business_name,
        scope_flags, status, current_step, data, created_at, updated_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      record.id,
      record.contract_id,
      record.client_email,
      record.client_name,
      record.business_name,
      JSON.stringify(record.scope_flags),
      record.status,
      record.current_step,
      JSON.stringify(record.data),
      record.created_at,
      record.updated_at,
      record.submitted_at,
    )
    .run();

  return record;
}

export async function getIntakeById(
  id: string,
  env: IntakeEnv,
): Promise<IntakeRecord | null> {
  const row = await env.DB.prepare(
    `SELECT * FROM intake_records WHERE id = ? LIMIT 1`,
  )
    .bind(id)
    .first<IntakeRow>();
  return row ? rowToRecord(row) : null;
}

export interface UpdateIntakeInput {
  data?: Record<string, unknown>;
  current_step?: number;
}

export async function updateIntakeData(
  id: string,
  patch: UpdateIntakeInput,
  env: IntakeEnv,
): Promise<IntakeRecord | null> {
  const existing = await getIntakeById(id, env);
  if (!existing) return null;

  const merged: IntakeRecord = {
    ...existing,
    data: patch.data ? { ...existing.data, ...patch.data } : existing.data,
    current_step: patch.current_step ?? existing.current_step,
    updated_at: Math.floor(Date.now() / 1000),
  };

  await env.DB.prepare(
    `UPDATE intake_records
       SET data = ?, current_step = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      JSON.stringify(merged.data),
      merged.current_step,
      merged.updated_at,
      id,
    )
    .run();

  return merged;
}

/**
 * Flip an intake to status='submitted' and stamp submitted_at. Used by the
 * Sprint-5 submit handler. Idempotent at the row level (re-running yields
 * the same end state) but the submit handler itself guards against double-
 * submit so side-effects don't fire twice.
 */
export async function markIntakeSubmitted(
  id: string,
  env: IntakeEnv,
): Promise<IntakeRecord | null> {
  const existing = await getIntakeById(id, env);
  if (!existing) return null;

  const now = Math.floor(Date.now() / 1000);
  const updated: IntakeRecord = {
    ...existing,
    status: 'submitted',
    current_step: 10,
    submitted_at: now,
    updated_at: now,
  };

  await env.DB.prepare(
    `UPDATE intake_records
       SET status = ?, current_step = ?, submitted_at = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(updated.status, updated.current_step, updated.submitted_at, updated.updated_at, id)
    .run();

  return updated;
}

export interface IntakeFileRow {
  id: string;
  intake_id: string;
  category: string;
  filename: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: number;
}

/**
 * List the files uploaded for an intake. Sprint 5 reads this directly when
 * preparing the brand-asset manifest for the Drive-sync step.
 */
export async function listIntakeFiles(
  intake_id: string,
  env: IntakeEnv,
): Promise<IntakeFileRow[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM intake_files WHERE intake_id = ? ORDER BY uploaded_at ASC`,
  )
    .bind(intake_id)
    .all<IntakeFileRow>();
  return result.results ?? [];
}
