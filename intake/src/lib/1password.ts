// 1Password Service Account client — Sprint 5.
//
// On intake submit, post a credential-method summary as a Secure Note to the
// Aeolistings Client Credentials vault (ONEPASSWORD_VAULT_UUID). The note
// records *how* the client granted access (delegate / password manager /
// screen-share / skip) per spec §5 — actual credentials never touch this
// system.
//
// Auth: Bearer ONEPASSWORD_SERVICE_ACCOUNT_TOKEN.
// API: https://developer.1password.com/docs/service-accounts/

const ONEPASSWORD_API_BASE = 'https://my.1password.com/api/v2';

export interface OnePasswordEnv {
  ONEPASSWORD_SERVICE_ACCOUNT_TOKEN: string;
  ONEPASSWORD_VAULT_UUID: string;
  fetcher?: typeof fetch;
}

export interface CredentialSummaryEntry {
  credential_type: string;
  method: string;
  status?: string;
  notes?: string;
}

export interface PostCredentialSummaryArgs {
  business_name: string;
  client_slug: string;
  intake_id: string;
  credentials: CredentialSummaryEntry[];
}

export interface PostCredentialSummaryResult {
  item_id: string;
}

function clientSlug(business_name: string): string {
  return business_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export { clientSlug };

async function onepasswordFetch(
  env: OnePasswordEnv,
  path: string,
  init: RequestInit,
): Promise<unknown> {
  const fetcher = env.fetcher ?? fetch;
  const res = await fetcher(`${ONEPASSWORD_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.ONEPASSWORD_SERVICE_ACCOUNT_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`1password ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`1password ${path} returned non-JSON`);
  }
}

/**
 * Create a Secure Note in the client-credentials vault summarising the
 * methods the client chose for each access category. The note is tagged
 * `client:<slug>` and `intake:<id>` so ops can filter by either.
 */
export async function postCredentialSummary(
  env: OnePasswordEnv,
  args: PostCredentialSummaryArgs,
): Promise<PostCredentialSummaryResult> {
  const slug = args.client_slug || clientSlug(args.business_name);
  const lines: string[] = [
    `Intake ID: ${args.intake_id}`,
    `Business: ${args.business_name}`,
    `Submitted: ${new Date().toISOString()}`,
    '',
    'Access methods granted at intake submission:',
  ];
  for (const c of args.credentials) {
    const status = c.status ? ` [${c.status}]` : '';
    lines.push(`• ${c.credential_type}: ${c.method}${status}`);
    if (c.notes) lines.push(`    notes: ${c.notes}`);
  }
  if (args.credentials.length === 0) {
    lines.push('• (no credential methods recorded yet)');
  }

  const body = {
    title: `${args.business_name} — Access summary (intake ${args.intake_id})`,
    category: 'SECURE_NOTE',
    vault: { id: env.ONEPASSWORD_VAULT_UUID },
    tags: [`client:${slug}`, `intake:${args.intake_id}`],
    fields: [
      {
        id: 'notesPlain',
        type: 'STRING',
        purpose: 'NOTES',
        label: 'notesPlain',
        value: lines.join('\n'),
      },
    ],
  };

  const result = (await onepasswordFetch(env, `/vaults/${env.ONEPASSWORD_VAULT_UUID}/items`, {
    method: 'POST',
    body: JSON.stringify(body),
  })) as { id?: string };
  if (!result.id) throw new Error('1password create item response missing id');
  return { item_id: result.id };
}
