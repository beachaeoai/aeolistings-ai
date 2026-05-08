// POST /api/intake/[token]/upload
//
// Sprint 3. Multipart upload for brand assets + trust-signal photos.
// One file per request keeps the implementation simple and matches the
// form's UX (each input element fires its own request as soon as the
// client picks a file).
//
// Token is verified but NOT rotated: uploads are side-channel writes and
// do not advance the form state. Saves still go through POST /api/intake/[token].

import type { APIRoute } from 'astro';
import {
  ALLOWED_CATEGORIES,
  MAX_UPLOAD_BYTES,
  isAllowedMime,
  saveUpload,
} from '../../../../lib/files';
import { verifyToken } from '../../../../lib/tokens';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json(500, { error: 'runtime env unavailable' });

  const token = params.token;
  if (!token) return json(400, { error: 'missing token' });

  const intake_id = await verifyToken(token, env);
  if (!intake_id) return json(401, { error: 'invalid or expired token' });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'expected multipart/form-data' });
  }

  const category = String(form.get('category') ?? '');
  if (!ALLOWED_CATEGORIES.has(category)) {
    return json(400, { error: 'invalid category' });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return json(400, { error: 'missing `file` field' });
  }
  if (file.size === 0) return json(400, { error: 'empty file' });
  if (file.size > MAX_UPLOAD_BYTES) {
    return json(413, { error: `file exceeds ${MAX_UPLOAD_BYTES} bytes` });
  }
  if (!isAllowedMime(file.type)) {
    return json(415, { error: 'unsupported media type' });
  }

  const bytes = await file.arrayBuffer();
  const saved = await saveUpload(
    {
      intake_id,
      category,
      filename: file.name,
      mime_type: file.type,
      bytes,
    },
    env,
  );

  return json(201, {
    file: {
      id: saved.id,
      filename: saved.filename,
      category: saved.category,
      mime_type: saved.mime_type,
      size_bytes: saved.size_bytes,
    },
  });
};
