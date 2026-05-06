// Magic-link token helpers — Sprint 1 implementation target.
//
// Token model:
//   - Format: <base64url(payload)>.<base64url(signature)>
//   - Payload: { intake_id: string, issued_at: number, single_use_id: string }
//   - Signature: HMAC-SHA256(payload, HMAC_SIGNING_KEY)
//   - Storage: KV namespace INTAKE_TOKENS
//     · key   = single_use_id
//     · value = { intake_id, expires_at, consumed: boolean }
//   - Lifecycle:
//     1. createToken(intake_id) → mints fresh token, stores single_use_id in KV with 7-day TTL
//     2. verifyToken(token) → decodes, checks signature, looks up KV, ensures not consumed/expired
//     3. consumeToken(token) → marks single_use_id as consumed in KV
//     4. rotateToken(intake_id) → consumes old, issues new (called on each save)
//
// THIS FILE IS A STUB. Sprint 1 fills it in with full implementation + tests.

export interface TokenPayload {
  intake_id: string;
  issued_at: number;
  single_use_id: string;
}

export interface TokenRecord {
  intake_id: string;
  expires_at: number;
  consumed: boolean;
}

export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Mint a fresh magic-link token for the given intake_id.
 * @returns the token string (base64url payload . base64url signature)
 */
export async function createToken(
  intake_id: string,
  env: Env,
): Promise<string> {
  throw new Error('Not implemented — Sprint 1');
}

/**
 * Verify a token: signature valid, not expired, not consumed.
 * @returns the intake_id if valid, null otherwise.
 */
export async function verifyToken(
  token: string,
  env: Env,
): Promise<string | null> {
  throw new Error('Not implemented — Sprint 1');
}

/**
 * Consume a token (single-use rotation). Call after a successful save.
 */
export async function consumeToken(token: string, env: Env): Promise<void> {
  throw new Error('Not implemented — Sprint 1');
}

/**
 * Rotate: consume the existing token and issue a new one for the same intake_id.
 */
export async function rotateToken(
  oldToken: string,
  env: Env,
): Promise<string> {
  throw new Error('Not implemented — Sprint 1');
}
