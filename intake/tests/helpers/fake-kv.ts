// Minimal in-memory KV that covers the put/get/delete shape tokens.ts uses.
// Implements expirationTtl by stamping an expiry the test clock can trip.

interface Entry {
  value: string;
  expires_at: number | null;
}

export class FakeKV {
  private store = new Map<string, Entry>();
  now: () => number = () => Date.now();

  async put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number },
  ): Promise<void> {
    const expires_at = opts?.expirationTtl
      ? this.now() + opts.expirationTtl * 1000
      : null;
    this.store.set(key, { value, expires_at });
  }

  async get<T = unknown>(
    key: string,
    type?: 'json' | 'text',
  ): Promise<T | string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires_at !== null && entry.expires_at <= this.now()) {
      this.store.delete(key);
      return null;
    }
    if (type === 'json') return JSON.parse(entry.value) as T;
    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Test helpers
  raw(key: string): Entry | undefined {
    return this.store.get(key);
  }
  size(): number {
    return this.store.size;
  }
}
