// Intake-record DB helpers — Sprint 1.
// Field shape mirrors migrations/0001_initial.sql.

import { ulid } from 'ulid';

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
