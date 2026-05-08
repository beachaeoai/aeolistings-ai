// File-upload helpers — Sprint 3.
//
// Brand assets (logos, photos) and trust-signal photos are persisted to R2
// (UPLOADS bucket) and indexed in intake_files. The form gets back a stable
// metadata id to reference in the JSON state; the bytes never round-trip
// through the form payload.

import { ulid } from 'ulidx';

export interface FilesEnv {
  DB: D1Database;
  UPLOADS: R2Bucket;
}

export interface IntakeFile {
  id: string;
  intake_id: string;
  category: string;
  filename: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: number;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB per file

export const ALLOWED_CATEGORIES = new Set([
  'logo_color',
  'logo_white',
  'logo_favicon',
  'photo',
  'project_photo',
  'font',
]);

const ALLOWED_MIME_PREFIXES = ['image/', 'font/', 'application/font-woff', 'application/octet-stream'];

export function isAllowedMime(mime: string): boolean {
  if (!mime) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.toLowerCase().startsWith(p));
}

function safeFilename(name: string): string {
  // Keep alphanum / dot / dash / underscore; collapse the rest to '-'.
  const base = name.split(/[\\/]/).pop() ?? 'file';
  return base.replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 120) || 'file';
}

export interface SaveUploadInput {
  intake_id: string;
  category: string;
  filename: string;
  mime_type: string;
  bytes: ArrayBuffer | Uint8Array;
}

export async function saveUpload(
  input: SaveUploadInput,
  env: FilesEnv,
): Promise<IntakeFile> {
  const id = ulid();
  const filename = safeFilename(input.filename);
  const r2_key = `intakes/${input.intake_id}/${input.category}/${id}-${filename}`;
  const size_bytes = input.bytes instanceof Uint8Array
    ? input.bytes.byteLength
    : input.bytes.byteLength;

  await env.UPLOADS.put(r2_key, input.bytes, {
    httpMetadata: { contentType: input.mime_type },
  });

  const uploaded_at = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO intake_files
       (id, intake_id, category, filename, r2_key, mime_type, size_bytes, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.intake_id,
      input.category,
      filename,
      r2_key,
      input.mime_type,
      size_bytes,
      uploaded_at,
    )
    .run();

  return {
    id,
    intake_id: input.intake_id,
    category: input.category,
    filename,
    r2_key,
    mime_type: input.mime_type,
    size_bytes,
    uploaded_at,
  };
}
