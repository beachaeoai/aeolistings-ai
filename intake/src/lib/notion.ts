// Notion API client wrapper — Sprint 5 implementation target.
//
// Responsibilities:
//   1. Duplicate the master template page (NOTION_TEMPLATE_PAGE_ID) into the
//      Client Engagements parent page (NOTION_PARENT_PAGE_ID) for each new
//      submitted intake.
//   2. Populate the duplicated page tree with values from the intake form.
//   3. Set the duplicated Engagement Overview sub-page to "anyone with the
//      link can view" so the client gets a shareable URL.
//   4. Return the URL of the new client page tree for the submit-handler to
//      include in Slack notifications + confirmation emails.
//
// Auth: NOTION_INTEGRATION_TOKEN (secret). Scoped to the master template +
// Client Engagements pages only.
//
// THIS FILE IS A STUB. Sprint 5 fills it in.

import { Client } from '@notionhq/client';

export function createNotionClient(env: Env): Client {
  return new Client({ auth: env.NOTION_INTEGRATION_TOKEN });
}

export interface IntakeData {
  // TODO: define this from the spec section 7 data model
  intake_id: string;
  client_name: string;
  business_name: string;
  scope_summary: string;
  // ...
}

/**
 * Duplicate the master template, populate with intake data, return the URL.
 */
export async function createClientPageTree(
  env: Env,
  intake: IntakeData,
): Promise<string> {
  throw new Error('Not implemented — Sprint 5');
}

/**
 * Set page-level sharing on the new client's Engagement Overview page so
 * the client can view it via shareable link.
 */
export async function makeOverviewPubliclyViewable(
  env: Env,
  client_page_id: string,
): Promise<string> {
  // Returns the shareable URL
  throw new Error('Not implemented — Sprint 5');
}
