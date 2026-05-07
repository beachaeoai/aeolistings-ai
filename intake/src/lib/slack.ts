// Slack webhook poster — Sprint 5 implementation target.
//
// Posts notifications to two channels:
//   - SLACK_WEBHOOK_INTAKE_OPS (#client-onboarding) — submit + edit events
//   - SLACK_WEBHOOK_BUILD (#aeolistings-build) — system errors, deploy notes
//
// THIS FILE IS A STUB. Sprint 5 fills it in.

export type SlackChannel = 'intake_ops' | 'build';

interface SlackBlock {
  type: string;
  [k: string]: unknown;
}

export interface SlackMessage {
  text: string; // fallback / notification text
  blocks?: SlackBlock[]; // rich-format blocks (Block Kit)
}

/**
 * Post a message to the specified Slack channel via incoming webhook.
 */
export async function postToSlack(
  env: Env,
  channel: SlackChannel,
  message: SlackMessage,
): Promise<void> {
  throw new Error('Not implemented — Sprint 5');
}

/**
 * Convenience: notify ops that a new intake was submitted.
 */
export async function notifyIntakeSubmitted(
  env: Env,
  args: {
    business_name: string;
    intake_id: string;
    notion_url: string;
    pending_items: string[];
  },
): Promise<void> {
  throw new Error('Not implemented — Sprint 5');
}

/**
 * Convenience: notify ops that a previously-submitted intake was edited.
 */
export async function notifyIntakeEdited(
  env: Env,
  args: {
    business_name: string;
    intake_id: string;
    edited_step: string;
    notion_url: string;
  },
): Promise<void> {
  throw new Error('Not implemented — Sprint 5');
}
