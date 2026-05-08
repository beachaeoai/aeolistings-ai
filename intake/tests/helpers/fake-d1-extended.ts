// Extended FakeD1 — handles intake_files writes for upload tests in addition
// to the original intake_records statements supported by helpers/fake-d1.ts.
//
// Composes the existing FakeD1 by re-implementing the small surface area
// rather than patching it; both fakes share the public statement protocol
// expected by D1Database consumers.

interface RecordRow {
  id: string;
  contract_id: string;
  client_email: string;
  client_name: string;
  business_name: string;
  scope_flags: string;
  status: string;
  current_step: number;
  data: string;
  created_at: number;
  updated_at: number;
  submitted_at: number | null;
}

interface FileRow {
  id: string;
  intake_id: string;
  category: string;
  filename: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: number;
}

export class FakeD1Extended {
  records = new Map<string, RecordRow>();
  files = new Map<string, FileRow>();

  prepare(sql: string) {
    return new ExtendedStatement(sql, this);
  }
}

class ExtendedStatement {
  private params: unknown[] = [];
  constructor(private sql: string, private db: FakeD1Extended) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async run(): Promise<{ success: true }> {
    const sql = this.sql.replace(/\s+/g, ' ').trim();
    if (sql.startsWith('INSERT INTO intake_records')) {
      const [
        id, contract_id, client_email, client_name, business_name,
        scope_flags, status, current_step, data, created_at, updated_at,
        submitted_at,
      ] = this.params as [
        string, string, string, string, string,
        string, string, number, string, number, number, number | null,
      ];
      this.db.records.set(id, {
        id, contract_id, client_email, client_name, business_name,
        scope_flags, status, current_step, data, created_at, updated_at,
        submitted_at,
      });
      return { success: true };
    }
    if (sql.startsWith('UPDATE intake_records')) {
      const [data, current_step, updated_at, id] = this.params as [
        string, number, number, string,
      ];
      const row = this.db.records.get(id);
      if (row) {
        this.db.records.set(id, { ...row, data, current_step, updated_at });
      }
      return { success: true };
    }
    if (sql.startsWith('INSERT INTO intake_files')) {
      const [
        id, intake_id, category, filename, r2_key,
        mime_type, size_bytes, uploaded_at,
      ] = this.params as [
        string, string, string, string, string, string, number, number,
      ];
      this.db.files.set(id, {
        id, intake_id, category, filename, r2_key,
        mime_type, size_bytes, uploaded_at,
      });
      return { success: true };
    }
    throw new Error(`FakeD1Extended run() does not handle: ${sql}`);
  }

  async first<T = unknown>(): Promise<T | null> {
    const sql = this.sql.replace(/\s+/g, ' ').trim();
    if (sql.startsWith('SELECT * FROM intake_records WHERE id = ?')) {
      const id = this.params[0] as string;
      return (this.db.records.get(id) as T | undefined) ?? null;
    }
    throw new Error(`FakeD1Extended first() does not handle: ${sql}`);
  }
}
