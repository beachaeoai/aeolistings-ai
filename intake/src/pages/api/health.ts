// Health-check endpoint — returns 200 + JSON describing the running app.
// Useful for: confirming a deploy succeeded, smoke-testing bindings, monitoring.

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env;

  // Validate that critical bindings are wired up
  const checks = {
    db: !!env?.DB,
    kv: !!env?.INTAKE_TOKENS,
    r2: !!env?.UPLOADS,
    notion_token_present: !!env?.NOTION_INTEGRATION_TOKEN,
    onepassword_token_present: !!env?.ONEPASSWORD_SERVICE_ACCOUNT_TOKEN,
    slack_webhook_present: !!env?.SLACK_WEBHOOK_INTAKE_OPS,
    resend_key_present: !!env?.RESEND_API_KEY,
    hmac_key_present: !!env?.HMAC_SIGNING_KEY,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  return new Response(
    JSON.stringify(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        environment: env?.ENVIRONMENT ?? 'unknown',
        timestamp: new Date().toISOString(),
        checks,
      },
      null,
      2,
    ),
    {
      status: allHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
};
