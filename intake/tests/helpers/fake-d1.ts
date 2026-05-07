// In-memory stand-in for D1, just enough to back the intake-record helpers.
// Supports the two SQL shapes intake.ts uses:
//   INSERT INTO intake_records (...) VALUES (?, ?, ...)
//   SELECT * FROM intake_records WHERE id = ? LIMIT 1
//   UPDATE intake_records SET data = ?, current_step = ?, updated_at = ? WHERE id = ?

interface Row {
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

export class FakeD1 {
  rows = new Map<string, Row>();

  prepare(sql: string) {
    return new FakeStatement(sql, this);
  }
}

class FakeStatement {
  private params: unknown[] = [];
  constructor(private sql: string, private db: FakeD1) {}

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
      this.db.rows.set(id, {
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
      const row = this.db.rows.get(id);
      if (row) {
        this.db.rows.set(id, { ...row, data, current_step, updated_at });
      }
      return { success: true };
    }
    throw new Error(`FakeD1 run() does not handle: ${sql}`);
  }

  async first<T = unknown>(): Promise<T | null> {
    const sql = this.sql.replace(/\s+/g, ' ').trim();
    if (sql.startsWith('SELECT * FROM intake_records WHERE id = ?')) {
      const id = this.params[0] as string;
      return (this.db.rows.get(id) as T | undefined) ?? null;
    }
    throw new Error(`FakeD1 first() does not handle: ${sql}`);
  }
}
