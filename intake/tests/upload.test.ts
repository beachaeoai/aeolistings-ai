// Upload endpoint tests — Sprint 3.
//
// Drives the route handler with a fake Cloudflare runtime + an extended
// FakeD1 that handles intake_files INSERTs alongside the existing
// intake_records statements.

import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';
import { POST as createIntakePost } from '../src/pages/api/intake/create';
import { POST as uploadPost } from '../src/pages/api/intake/[token]/upload';
import { FakeD1Extended } from './helpers/fake-d1-extended';
import { FakeKV } from './helpers/fake-kv';
import { FakeR2 } from './helpers/fake-r2';

interface UploadEnv {
  DB: D1Database;
  INTAKE_TOKENS: KVNamespace;
  UPLOADS: R2Bucket;
  HMAC_SIGNING_KEY: string;
  APP_URL: string;
}

function buildEnv(): UploadEnv & { _kv: FakeKV; _db: FakeD1Extended; _r2: FakeR2 } {
  const _kv = new FakeKV();
  const _db = new FakeD1Extended();
  const _r2 = new FakeR2();
  return {
    DB: _db as unknown as D1Database,
    INTAKE_TOKENS: _kv as unknown as KVNamespace,
    UPLOADS: _r2 as unknown as R2Bucket,
    HMAC_SIGNING_KEY: 'upload-key-aaaaaaaaaaaaaaaaaaaaaaa',
    APP_URL: 'https://intake.test',
    _kv,
    _db,
    _r2,
  };
}

function ctx(env: UploadEnv, request: Request, params: Record<string, string> = {}) {
  return {
    request,
    params,
    locals: { runtime: { env } },
  } as unknown as APIContext;
}

const sample = {
  contract_id: 'c1',
  client_email: 'a@b.test',
  client_name: 'Sam Sample',
  business_name: 'Sample Co',
  scope_flags: { website: true },
};

async function bootstrap() {
  const env = buildEnv();
  const created = (await (
    await createIntakePost(
      ctx(env, new Request('https://x/api/intake/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': env.HMAC_SIGNING_KEY },
        body: JSON.stringify(sample),
      })),
    )
  ).json()) as { intake_id: string; token: string };
  return { env, ...created };
}

function makeFile(name: string, mime: string, sizeBytes: number): File {
  const bytes = new Uint8Array(sizeBytes);
  for (let i = 0; i < sizeBytes; i++) bytes[i] = (i * 7) & 0xff;
  return new File([bytes], name, { type: mime });
}

async function callUpload(env: UploadEnv, token: string, form: FormData) {
  return uploadPost(
    ctx(env, new Request(`https://x/api/intake/${token}/upload`, {
      method: 'POST',
      body: form,
    }), { token }),
  );
}

describe('POST /api/intake/[token]/upload', () => {
  it('rejects an invalid token with 401', async () => {
    const env = buildEnv();
    const fd = new FormData();
    fd.append('category', 'logo_color');
    fd.append('file', makeFile('logo.svg', 'image/svg+xml', 100));
    const res = await callUpload(env, 'garbage', fd);
    expect(res.status).toBe(401);
  });

  it('rejects an unknown category with 400', async () => {
    const { env, token } = await bootstrap();
    const fd = new FormData();
    fd.append('category', 'not-a-category');
    fd.append('file', makeFile('x.png', 'image/png', 100));
    const res = await callUpload(env, token, fd);
    expect(res.status).toBe(400);
  });

  it('rejects an empty file with 400', async () => {
    const { env, token } = await bootstrap();
    const fd = new FormData();
    fd.append('category', 'logo_color');
    fd.append('file', makeFile('empty.png', 'image/png', 0));
    const res = await callUpload(env, token, fd);
    expect(res.status).toBe(400);
  });

  it('rejects a file over 25MB with 413', async () => {
    const { env, token } = await bootstrap();
    const fd = new FormData();
    fd.append('category', 'photo');
    fd.append('file', makeFile('huge.png', 'image/png', 26 * 1024 * 1024));
    const res = await callUpload(env, token, fd);
    expect(res.status).toBe(413);
  });

  it('rejects an unsupported mime type with 415', async () => {
    const { env, token } = await bootstrap();
    const fd = new FormData();
    fd.append('category', 'logo_color');
    fd.append('file', makeFile('weird.exe', 'application/x-msdownload', 1024));
    const res = await callUpload(env, token, fd);
    expect(res.status).toBe(415);
  });

  it('writes to R2 + intake_files and returns metadata', async () => {
    const { env, token, intake_id } = await bootstrap();
    const fd = new FormData();
    fd.append('category', 'logo_color');
    fd.append('file', makeFile('hello world.svg', 'image/svg+xml', 1234));
    const res = await callUpload(env, token, fd);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { file: { id: string; filename: string; size_bytes: number } };
    expect(body.file.size_bytes).toBe(1234);
    expect(body.file.filename).toBe('hello-world.svg');

    expect(env._db.files.size).toBe(1);
    const fileRow = [...env._db.files.values()][0]!;
    expect(fileRow.intake_id).toBe(intake_id);
    expect(fileRow.category).toBe('logo_color');
    expect(fileRow.r2_key.startsWith(`intakes/${intake_id}/logo_color/`)).toBe(true);
    expect(env._r2.store.has(fileRow.r2_key)).toBe(true);
    expect(env._r2.store.get(fileRow.r2_key)?.contentType).toBe('image/svg+xml');
  });

  it('does not consume the token (uploads are side-channel)', async () => {
    const { env, token } = await bootstrap();
    const fd = new FormData();
    fd.append('category', 'photo');
    fd.append('file', makeFile('a.png', 'image/png', 100));
    const first = await callUpload(env, token, fd);
    expect(first.status).toBe(201);

    const fd2 = new FormData();
    fd2.append('category', 'photo');
    fd2.append('file', makeFile('b.png', 'image/png', 100));
    const second = await callUpload(env, token, fd2);
    expect(second.status).toBe(201);
  });
});
