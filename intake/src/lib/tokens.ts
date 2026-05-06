// Magic-link token helpers — Sprint 1.
//
// Token model:
//   Format:    <base64url(payload)>.<base64url(signature)>
//   Payload:   { intake_id, issued_at, single_use_id }
//   Signature: HMAC-SHA256(payload, HMAC_SIGNING_KEY)
//   KV store:  INTAKE_TOKENS[single_use_id] = { intake_id, expires_at, consumed }
//
// Lifecycle:
//   createToken(intake_id) → mint fresh token, store single_use_id record (7-day TTL)
//   verifyToken(token)     → decode, check signature, KV lookup, reject if consumed/expired
//   consumeToken(token)    → flip consumed=true on the KV record
//   rotateToken(oldToken)  → consume old + issue new for same intake_id (call after save)

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

export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// Subset of Env we actually depend on — keeps the module testable without a full Env mock.
export interface TokenEnv {
  INTAKE_TOKENS: KVNamespace;
  HMAC_SIGNING_KEY: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payloadB64: string, secret: string): Promise<string> {
  const key = await getSigningKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  return toBase64Url(new Uint8Array(sig));
}

async function verifySignature(
  payloadB64: string,
  sigB64: string,
  secret: string,
): Promise<boolean> {
  const key = await getSigningKey(secret);
  return crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(sigB64),
    encoder.encode(payloadB64),
  );
}

function encodePayload(p: TokenPayload): string {
  return toBase64Url(encoder.encode(JSON.stringify(p)));
}

function decodePayload(b64: string): TokenPayload | null {
  try {
    const parsed = JSON.parse(decoder.decode(fromBase64Url(b64)));
    if (
      typeof parsed?.intake_id !== 'string' ||
      typeof parsed?.issued_at !== 'number' ||
      typeof parsed?.single_use_id !== 'string'
    ) {
      return null;
    }
    return parsed as TokenPayload;
  } catch {
    return null;
  }
}

export async function createToken(
  intake_id: string,
  env: TokenEnv,
): Promise<string> {
  if (!env.HMAC_SIGNING_KEY) {
    throw new Error('HMAC_SIGNING_KEY is not configured');
  }
  const issued_at = Math.floor(Date.now() / 1000);
  const single_use_id = crypto.randomUUID();
  const expires_at = issued_at + TOKEN_TTL_SECONDS;

  const payloadB64 = encodePayload({ intake_id, issued_at, single_use_id });
  const sigB64 = await sign(payloadB64, env.HMAC_SIGNING_KEY);

  const record: TokenRecord = { intake_id, expires_at, consumed: false };
  await env.INTAKE_TOKENS.put(single_use_id, JSON.stringify(record), {
    expirationTtl: TOKEN_TTL_SECONDS,
  });

  return `${payloadB64}.${sigB64}`;
}

interface DecodedToken {
  payload: TokenPayload;
  payloadB64: string;
  sigB64: string;
}

function decodeToken(token: string): DecodedToken | null {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const dot = token.indexOf('.');
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!payloadB64 || !sigB64 || sigB64.includes('.')) return null;
  const payload = decodePayload(payloadB64);
  if (!payload) return null;
  return { payload, payloadB64, sigB64 };
}

export async function verifyToken(
  token: string,
  env: TokenEnv,
): Promise<string | null> {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  const sigOk = await verifySignature(
    decoded.payloadB64,
    decoded.sigB64,
    env.HMAC_SIGNING_KEY,
  );
  if (!sigOk) return null;

  const record = await env.INTAKE_TOKENS.get<TokenRecord>(
    decoded.payload.single_use_id,
    'json',
  );
  if (!record) return null;
  if (record.consumed) return null;
  if (record.expires_at <= Math.floor(Date.now() / 1000)) return null;
  if (record.intake_id !== decoded.payload.intake_id) return null;

  return record.intake_id;
}

export async function consumeToken(
  token: string,
  env: TokenEnv,
): Promise<void> {
  const decoded = decodeToken(token);
  if (!decoded) return;

  const sigOk = await verifySignature(
    decoded.payloadB64,
    decoded.sigB64,
    env.HMAC_SIGNING_KEY,
  );
  if (!sigOk) return;

  const record = await env.INTAKE_TOKENS.get<TokenRecord>(
    decoded.payload.single_use_id,
    'json',
  );
  if (!record) return;

  const ttl = Math.max(60, record.expires_at - Math.floor(Date.now() / 1000));
  await env.INTAKE_TOKENS.put(
    decoded.payload.single_use_id,
    JSON.stringify({ ...record, consumed: true } satisfies TokenRecord),
    { expirationTtl: ttl },
  );
}

export async function rotateToken(
  oldToken: string,
  env: TokenEnv,
): Promise<string> {
  const intake_id = await verifyToken(oldToken, env);
  if (!intake_id) {
    throw new Error('Cannot rotate — old token is invalid, expired, or consumed');
  }
  await consumeToken(oldToken, env);
  return createToken(intake_id, env);
}
