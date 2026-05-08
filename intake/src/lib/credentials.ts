// Intake-credentials helpers — Sprint 4.
//
// Per spec §5: credential metadata only — never raw passwords. This module
// writes one row to intake_credentials per (intake, credential_type), and
// upserts on subsequent saves so the table reflects the client's latest
// stated method without growing unbounded.

import { ulid } from 'ulidx';
import type { CredentialEntry, CredentialMethod, CredentialStatus } from './step-state';

export interface CredentialsEnv {
  DB: D1Database;
}

export interface CredentialRow {
  id: string;
  intake_id: string;
  credential_type: string;
  method: CredentialMethod;
  status: CredentialStatus;
  notes: string | null;
  granted_at: number | null;
  verified_at: number | null;
}

const VALID_METHODS = new Set<CredentialMethod>([
  'delegate', 'password_manager', 'screen_share', 'skip',
]);

export function isValidMethod(m: string): m is CredentialMethod {
  return VALID_METHODS.has(m as CredentialMethod);
}

/**
 * Upsert a single credential entry for an intake. Rows are addressed by
 * (intake_id, credential_type); a new ULID is minted on first write and
 * preserved on update so external systems (1Password sync at submit time)
 * can reference a stable id.
 */
export async function upsertCredential(
  intake_id: string,
  entry: { credential_type: string; method: CredentialMethod; notes?: string },
  env: CredentialsEnv,
): Promise<CredentialRow> {
  const existing = await env.DB.prepare(
    `SELECT * FROM intake_credentials
       WHERE intake_id = ? AND credential_type = ?
       LIMIT 1`,
  )
    .bind(intake_id, entry.credential_type)
    .first<CredentialRow>();

  const now = Math.floor(Date.now() / 1000);
  // 'delegate' / 'password_manager' / 'screen_share' all start as pending —
  // verification happens out-of-band when the Aeolistings team confirms access.
  // 'skip' is recorded as 'granted' (client opted out, nothing to verify).
  const status: CredentialStatus = entry.method === 'skip' ? 'granted' : 'pending';
  const granted_at = entry.method === 'skip' ? now : null;

  if (existing) {
    await env.DB.prepare(
      `UPDATE intake_credentials
         SET method = ?, status = ?, notes = ?, granted_at = ?
         WHERE id = ?`,
    )
      .bind(entry.method, status, entry.notes ?? null, granted_at, existing.id)
      .run();
    return {
      ...existing,
      method: entry.method,
      status,
      notes: entry.notes ?? null,
      granted_at,
    };
  }

  const id = ulid();
  await env.DB.prepare(
    `INSERT INTO intake_credentials
       (id, intake_id, credential_type, method, status, notes, granted_at, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, intake_id, entry.credential_type, entry.method, status,
          entry.notes ?? null, granted_at, null)
    .run();

  return {
    id,
    intake_id,
    credential_type: entry.credential_type,
    method: entry.method,
    status,
    notes: entry.notes ?? null,
    granted_at,
    verified_at: null,
  };
}

export async function listCredentials(
  intake_id: string,
  env: CredentialsEnv,
): Promise<CredentialRow[]> {
  const result = await env.DB.prepare(
    `SELECT * FROM intake_credentials WHERE intake_id = ? ORDER BY credential_type ASC`,
  )
    .bind(intake_id)
    .all<CredentialRow>();
  return result.results ?? [];
}

/**
 * Map a CredentialRow to the JSON-friendly shape the form stores in
 * data.step5.credentials. Drops nulls so the JSON column stays clean.
 */
export function rowToEntry(row: CredentialRow): CredentialEntry {
  const out: CredentialEntry = {
    credential_type: row.credential_type,
    method: row.method,
    status: row.status,
  };
  if (row.notes) out.notes = row.notes;
  return out;
}
