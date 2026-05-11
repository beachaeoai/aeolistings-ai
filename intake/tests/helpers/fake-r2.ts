// In-memory R2 fake — covers the put/get surface used by saveUpload and
// the upload endpoint. Stores both the bytes and the http metadata so tests
// can assert content-type round-tripping.

interface Stored {
  body: Uint8Array;
  contentType: string | undefined;
}

export class FakeR2 {
  store = new Map<string, Stored>();

  async put(
    key: string,
    body: ArrayBuffer | Uint8Array | ReadableStream,
    opts?: { httpMetadata?: { contentType?: string } },
  ): Promise<{ key: string; size: number }> {
    const bytes =
      body instanceof Uint8Array
        ? body
        : body instanceof ArrayBuffer
          ? new Uint8Array(body)
          : new Uint8Array(0);
    this.store.set(key, { body: bytes, contentType: opts?.httpMetadata?.contentType });
    return { key, size: bytes.byteLength };
  }

  async get(key: string): Promise<{ body: Uint8Array; contentType: string | undefined } | null> {
    return this.store.get(key) ?? null;
  }
}
