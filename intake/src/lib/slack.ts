// Slack webhook poster — Sprint 5.
//
// Posts notifications via Slack Incoming Webhooks. Two channels are wired:
//   - SLACK_WEBHOOK_INTAKE_OPS (#client-onboarding) — submit + edit events
//   - SLACK_WEBHOOK_BUILD (#aeolistings-build) — system errors, deploy notes
//
// Webhooks accept a JSON body with `text` (fallback) and optional `blocks`
// (Block Kit). The submit handler calls this with the channel set to
// 'intake_ops' and waits for the response so partial-failure tolerance can
// route errors back to the caller — Slack down should not 500 the submit
// endpoint, but the caller wants to surface "Slack pending" to the client.

export type SlackChannel = 'intake_ops' | 'build';

interface SlackBlock {
  type: string;
  [k: string]: unknown;
}

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackEnv {
  SLACK_WEBHOOK_INTAKE_OPS: string;
  SLACK_WEBHOOK_BUILD: string;
  fetcher?: typeof fetch;
}

function webhookFor(env: SlackEnv, channel: SlackChannel): string {
  return channel === 'intake_ops'
    ? env.SLACK_WEBHOOK_INTAKE_OPS
    : env.SLACK_WEBHOOK_BUILD;
}

export async function postToSlack(
  env: SlackEnv,
  channel: SlackChannel,
  message: SlackMessage,
): Promise<void> {
  const url = webhookFor(env, channel);
  if (!url) throw new Error(`missing webhook for channel ${channel}`);
  const fetcher = env.fetcher ?? fetch;
  const res = await fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`slack webhook failed: ${res.status} ${body.slice(0, 200)}`);
  }
}

export interface IntakeSubmittedArgs {
  business_name: string;
  intake_id: string;
  notion_url?: string;
  pending_items?: string[];
  edit_url?: string;
}

export async function notifyIntakeSubmitted(
  env: SlackEnv,
  args: IntakeSubmittedArgs,
): Promise<void> {
  const fields: string[] = [
    `*Intake ID:* \`${args.intake_id}\``,
  ];
  if (args.notion_url) fields.push(`*Notion:* <${args.notion_url}|open project page>`);
  if (args.edit_url) fields.push(`*Magic link:* <${args.edit_url}|edit/resume>`);
  if (args.pending_items && args.pending_items.length > 0) {
    fields.push(`*Pending:* ${args.pending_items.join(', ')}`);
  }

  const message: SlackMessage = {
    text: `${args.business_name} just submitted intake ${args.intake_id}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:rocket: *${args.business_name}* just submitted their intake.`,
        },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: fields.join('\n') },
      },
    ],
  };
  await postToSlack(env, 'intake_ops', message);
}

export interface IntakeEditedArgs {
  business_name: string;
  intake_id: string;
  edited_step: string;
  notion_url?: string;
}

export async function notifyIntakeEdited(
  env: SlackEnv,
  args: IntakeEditedArgs,
): Promise<void> {
  const detail =
    `*Intake ID:* \`${args.intake_id}\`` +
    (args.notion_url ? `\n*Notion:* <${args.notion_url}|open project page>` : '');
  await postToSlack(env, 'intake_ops', {
    text: `${args.business_name} updated ${args.edited_step}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:pencil2: *${args.business_name}* updated *${args.edited_step}*.`,
        },
      },
      { type: 'section', text: { type: 'mrkdwn', text: detail } },
    ],
  });
}
