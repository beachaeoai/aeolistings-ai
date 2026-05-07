/// <reference types="astro/client" />

// Cloudflare bindings + env vars exposed to Astro server-side code.
// Mirrors wrangler.toml. Keep these two in sync.

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  // Cloudflare resource bindings
  DB: D1Database;
  INTAKE_TOKENS: KVNamespace;
  UPLOADS: R2Bucket;

  // Public, non-secret config (from wrangler.toml [vars])
  ENVIRONMENT: 'development' | 'production';
  APP_URL: string;
  NOTION_TEMPLATE_PAGE_ID: string;
  NOTION_PARENT_PAGE_ID: string;
  ONEPASSWORD_VAULT_UUID: string;
  APPOINTMENT_SCHEDULING_URL: string;
  SENDER_EMAIL: string;
  SLACK_CHANNEL_INTAKE_OPS: string;
  SLACK_CHANNEL_BUILD: string;

  // Secrets (from .dev.vars locally, Cloudflare encrypted env in production)
  NOTION_INTEGRATION_TOKEN: string;
  ONEPASSWORD_SERVICE_ACCOUNT_TOKEN: string;
  SLACK_WEBHOOK_INTAKE_OPS: string;
  SLACK_WEBHOOK_BUILD: string;
  RESEND_API_KEY: string;
  HMAC_SIGNING_KEY: string;
}
