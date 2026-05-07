-- ============================================================
-- Initial schema for Aeolistings client intake system
-- Per docs/specs/client-intake-v1.0.md section 7
--
-- Apply locally:  npm run db:migrate:local
-- Apply remote:   npm run db:migrate:remote
-- ============================================================

-- ============================================================
-- intake_records — one row per active or completed intake
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_records (
  id              TEXT PRIMARY KEY,           -- ULID
  contract_id     TEXT NOT NULL,              -- references signed quote
  client_email    TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  business_name   TEXT NOT NULL,
  scope_flags     TEXT NOT NULL,              -- JSON: {website: true, gbp: true, ...}
  status          TEXT NOT NULL,              -- 'in_progress' | 'submitted' | 'editing'
  current_step    INTEGER NOT NULL DEFAULT 0,
  data            TEXT NOT NULL DEFAULT '{}', -- JSON blob of all form data
  created_at      INTEGER NOT NULL,           -- unix seconds
  updated_at      INTEGER NOT NULL,
  submitted_at    INTEGER                     -- null until submit
);

CREATE INDEX IF NOT EXISTS idx_intake_records_status
  ON intake_records(status);

CREATE INDEX IF NOT EXISTS idx_intake_records_client_email
  ON intake_records(client_email);

CREATE INDEX IF NOT EXISTS idx_intake_records_contract_id
  ON intake_records(contract_id);

-- ============================================================
-- intake_files — one row per uploaded asset (logo, photos, etc.)
-- Files themselves live in R2 (UPLOADS bucket); this row is metadata.
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_files (
  id              TEXT PRIMARY KEY,           -- ULID
  intake_id       TEXT NOT NULL REFERENCES intake_records(id),
  category        TEXT NOT NULL,              -- 'logo' | 'photo' | 'project' | etc.
  filename        TEXT NOT NULL,              -- original client-provided name
  r2_key          TEXT NOT NULL,              -- key in UPLOADS bucket
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  uploaded_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_files_intake_id
  ON intake_files(intake_id);

CREATE INDEX IF NOT EXISTS idx_intake_files_category
  ON intake_files(category);

-- ============================================================
-- intake_credentials — metadata only, NEVER raw credentials
-- Tracks how access was granted for each access need.
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_credentials (
  id              TEXT PRIMARY KEY,           -- ULID
  intake_id       TEXT NOT NULL REFERENCES intake_records(id),
  credential_type TEXT NOT NULL,              -- 'domain_registrar' | 'gbp' | 'wordpress' | etc.
  method          TEXT NOT NULL,              -- 'delegate' | 'password_manager' | 'screen_share' | 'skip'
  status          TEXT NOT NULL,              -- 'pending' | 'granted' | 'verified'
  notes           TEXT,
  granted_at      INTEGER,
  verified_at     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_intake_credentials_intake_id
  ON intake_credentials(intake_id);

CREATE INDEX IF NOT EXISTS idx_intake_credentials_status
  ON intake_credentials(status);
