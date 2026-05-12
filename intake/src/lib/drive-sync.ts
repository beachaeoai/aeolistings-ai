// R2 → Drive sync — Sprint 5.
//
// The full sync to a Drive folder needs a Google service-account credential
// the engagement doesn't have provisioned yet (spec §13 lists 1Password +
// Notion + Slack + Cloudflare; Drive sync is on the post-v1 roadmap). For
// v1 we produce a structured manifest of the files in R2 so ops can copy
// them manually via the Cloudflare dashboard — and emit the manifest to
// Slack / Notion so nothing is lost.
//
// Reads from intake_files directly (per spec §8 and the Sprint-5 brief);
// does not trust data.step3 because the upload endpoint is the source of
// truth for what bytes actually landed.

import { listIntakeFiles, type IntakeFileRow, type IntakeEnv } from './intake';

export interface BrandAssetManifestEntry {
  id: string;
  category: string;
  filename: string;
  r2_key: string;
  size_bytes: number;
  mime_type: string;
}

export interface BrandAssetManifest {
  intake_id: string;
  file_count: number;
  total_bytes: number;
  files: BrandAssetManifestEntry[];
}

export async function buildBrandAssetManifest(
  intake_id: string,
  env: IntakeEnv,
): Promise<BrandAssetManifest> {
  const rows = await listIntakeFiles(intake_id, env);
  return {
    intake_id,
    file_count: rows.length,
    total_bytes: rows.reduce((acc, r) => acc + r.size_bytes, 0),
    files: rows.map(toManifestEntry),
  };
}

function toManifestEntry(row: IntakeFileRow): BrandAssetManifestEntry {
  return {
    id: row.id,
    category: row.category,
    filename: row.filename,
    r2_key: row.r2_key,
    size_bytes: row.size_bytes,
    mime_type: row.mime_type,
  };
}
