import { describe, expect, it } from 'vitest';
import {
  consumeToken,
  createToken,
  rotateToken,
  TOKEN_TTL_SECONDS,
  verifyToken,
  type TokenRecord,
} from '../src/lib/tokens';
import { FakeKV } from './helpers/fake-kv';

function makeEnv(overrides: Partial<{ key: string }> = {}) {
  const INTAKE_TOKENS = new FakeKV();
  return {
    INTAKE_TOKENS: INTAKE_TOKENS as unknown as KVNamespace,
    HMAC_SIGNING_KEY: overrides.key ?? 'test-hmac-key-aaaaaaaaaaaaaaaaaaaaaaaa',
    _kv: INTAKE_TOKENS,
  };
}

function payloadFromToken(token: string) {
  const [b64] = token.split('.');
  const bin = atob(b64!.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes)) as {
    intake_id: string;
    issued_at: number;
    single_use_id: string;
  };
}

describe('createToken', () => {
  it('mints a token in <payload>.<signature> format', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    expect(token.split('.')).toHaveLength(2);
  });

  it('writes a KV record keyed by single_use_id with consumed=false', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);
    const record = await env._kv.get<TokenRecord>(single_use_id, 'json');
    expect(record).toMatchObject({ intake_id: 'intake-1', consumed: false });
    expect(record!.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('uses a 7-day TTL on the KV record', async () => {
    const env = makeEnv();
    const before = Math.floor(Date.now() / 1000);
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);
    const record = (await env._kv.get<TokenRecord>(single_use_id, 'json'))!;
    const ttl = record.expires_at - before;
    expect(ttl).toBeGreaterThanOrEqual(TOKEN_TTL_SECONDS - 5);
    expect(ttl).toBeLessThanOrEqual(TOKEN_TTL_SECONDS + 5);
  });

  it('mints distinct single_use_ids on repeat calls for the same intake', async () => {
    const env = makeEnv();
    const a = await createToken('intake-1', env);
    const b = await createToken('intake-1', env);
    expect(a).not.toEqual(b);
    expect(payloadFromToken(a).single_use_id).not.toEqual(
      payloadFromToken(b).single_use_id,
    );
  });

  it('throws if HMAC_SIGNING_KEY is missing', async () => {
    const env = makeEnv({ key: '' });
    await expect(createToken('intake-1', env)).rejects.toThrow(
      /HMAC_SIGNING_KEY/,
    );
  });
});

describe('verifyToken', () => {
  it('returns the intake_id for a fresh token', async () => {
    const env = makeEnv();
    const token = await createToken('intake-7', env);
    expect(await verifyToken(token, env)).toBe('intake-7');
  });

  it('returns null for a malformed token', async () => {
    const env = makeEnv();
    expect(await verifyToken('garbage', env)).toBeNull();
    expect(await verifyToken('a.b', env)).toBeNull();
    expect(await verifyToken('', env)).toBeNull();
    expect(await verifyToken('a.b.c', env)).toBeNull();
  });

  it('returns null when signed with a different HMAC key', async () => {
    const envA = makeEnv({ key: 'key-aaaaaaaa' });
    const envB = makeEnv({ key: 'key-bbbbbbbb' });
    const token = await createToken('intake-1', envA);
    // Even after copying the KV record, the bad signature should reject.
    const { single_use_id } = payloadFromToken(token);
    const record = await envA._kv.get(single_use_id, 'text');
    await envB._kv.put(single_use_id, record as string);
    expect(await verifyToken(token, envB)).toBeNull();
  });

  it('returns null when the KV record is missing (e.g. expired and evicted)', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);
    await env._kv.delete(single_use_id);
    expect(await verifyToken(token, env)).toBeNull();
  });

  it('returns null when expires_at has passed', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);
    const record = (await env._kv.get<TokenRecord>(single_use_id, 'json'))!;
    await env._kv.put(
      single_use_id,
      JSON.stringify({ ...record, expires_at: Math.floor(Date.now() / 1000) - 1 }),
    );
    expect(await verifyToken(token, env)).toBeNull();
  });

  it('returns null when the token has been consumed', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    await consumeToken(token, env);
    expect(await verifyToken(token, env)).toBeNull();
  });

  it('returns null if the KV record intake_id mismatches the payload', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);
    const record = (await env._kv.get<TokenRecord>(single_use_id, 'json'))!;
    await env._kv.put(
      single_use_id,
      JSON.stringify({ ...record, intake_id: 'intake-other' }),
    );
    expect(await verifyToken(token, env)).toBeNull();
  });
});

describe('consumeToken', () => {
  it('flips consumed=true on the KV record', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);

    await consumeToken(token, env);

    const record = await env._kv.get<TokenRecord>(single_use_id, 'json');
    expect(record?.consumed).toBe(true);
  });

  it('makes subsequent verifyToken calls return null', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    expect(await verifyToken(token, env)).toBe('intake-1');
    await consumeToken(token, env);
    expect(await verifyToken(token, env)).toBeNull();
  });

  it('is a no-op for a malformed token (does not throw)', async () => {
    const env = makeEnv();
    await expect(consumeToken('not-a-token', env)).resolves.toBeUndefined();
  });

  it('is a no-op for a token whose signature does not match', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    const { single_use_id } = payloadFromToken(token);
    const tampered = token.slice(0, -2) + 'xx';

    await consumeToken(tampered, env);

    const record = await env._kv.get<TokenRecord>(single_use_id, 'json');
    expect(record?.consumed).toBe(false);
  });
});

describe('rotateToken', () => {
  it('returns a new token that verifies to the same intake_id', async () => {
    const env = makeEnv();
    const oldToken = await createToken('intake-42', env);
    const newToken = await rotateToken(oldToken, env);

    expect(newToken).not.toBe(oldToken);
    expect(await verifyToken(newToken, env)).toBe('intake-42');
  });

  it('consumes the old token (single-use rotation)', async () => {
    const env = makeEnv();
    const oldToken = await createToken('intake-42', env);
    await rotateToken(oldToken, env);
    expect(await verifyToken(oldToken, env)).toBeNull();
  });

  it('throws if the old token is invalid or already consumed', async () => {
    const env = makeEnv();
    const token = await createToken('intake-1', env);
    await consumeToken(token, env);
    await expect(rotateToken(token, env)).rejects.toThrow();
    await expect(rotateToken('not-a-token', env)).rejects.toThrow();
  });

  it('preserves the intake_id across many rotations', async () => {
    const env = makeEnv();
    let token = await createToken('intake-X', env);
    for (let i = 0; i < 5; i++) {
      token = await rotateToken(token, env);
    }
    expect(await verifyToken(token, env)).toBe('intake-X');
  });
});
