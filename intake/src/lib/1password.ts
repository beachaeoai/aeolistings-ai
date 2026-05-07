// 1Password Connect client — Sprint 5 implementation target.
//
// Auth: ONEPASSWORD_SERVICE_ACCOUNT_TOKEN (secret).
// Vault: ONEPASSWORD_VAULT_UUID — Aeolistings Client Credentials.
//
// Responsibilities:
//   - When the intake submit handler creates a new client, it creates a
//     placeholder folder/tag in the vault for that client (e.g.,
//     `client:eco-roofing`).
//   - For each credential the client granted via the "share via 1Password"
//     path in Step 5 of intake, the system records metadata (granted-at,
//     method, status) in the D1 intake_credentials table — NOT the credential
//     itself. The actual credential goes into 1Password manually by the
//     Aeolistings team after the client uses 1Password Share / BitWarden Send.
//   - Optional v1.1: programmatically generate 1Password Share links from
//     placeholder items so the form can hand the client a direct upload URL.
//
// THIS FILE IS A STUB. Sprint 5 fills it in.
//
// API reference:
//   https://developer.1password.com/docs/connect/connect-api-reference/
//   https://developer.1password.com/docs/service-accounts/

const ONEPASSWORD_API_BASE = 'https://my.1password.com/api/v2';

/**
 * Create a tag for a new client in the vault.
 * Tag format: `client:<slug>` (e.g., `client:eco-roofing`)
 */
export async function createClientTag(
  env: Env,
  client_slug: string,
): Promise<void> {
  throw new Error('Not implemented — Sprint 5');
}

/**
 * Create a placeholder Secure Note for a credential the client will fill in.
 * The note title format: "<Business Name> — <Credential Type>"
 * Returns the item ID for later reference / Share-link generation.
 */
export async function createCredentialPlaceholder(
  env: Env,
  args: {
    business_name: string;
    client_slug: string;
    credential_type: string; // e.g., "Domain Registrar", "WordPress Admin"
  },
): Promise<string> {
  throw new Error('Not implemented — Sprint 5');
}
