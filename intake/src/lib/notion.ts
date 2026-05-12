// Notion API client wrapper — Sprint 5.
//
// On intake submit, create a child page under the "Client Engagements" parent
// (NOTION_PARENT_PAGE_ID) populated with the engagement summary. The master
// template (NOTION_TEMPLATE_PAGE_ID) is referenced as the human-curated source
// of the sub-page structure — full block-tree duplication is deferred to a
// later sprint; v1.0 captures the structured data that drives the client
// kickoff and links back to the template for ops to extend.
//
// Direct fetch is used instead of @notionhq/client to keep the Workers
// runtime free of Node-only dependencies — the v1 surface is small enough
// that the SDK isn't worth pulling in.

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export interface NotionEnv {
  NOTION_INTEGRATION_TOKEN: string;
  NOTION_TEMPLATE_PAGE_ID: string;
  NOTION_PARENT_PAGE_ID: string;
  fetcher?: typeof fetch;
}

export interface NotionIntakeSummary {
  intake_id: string;
  business_name: string;
  client_name: string;
  client_email: string;
  scope_summary: string;
  primary_contact?: { name?: string; email?: string; phone?: string; role?: string };
  named_experts?: { name?: string; title?: string }[];
  cities?: { name: string }[];
  credentials?: { credential_type: string; method: string; status?: string }[];
  files?: { category: string; filename: string }[];
  submitted_at_iso: string;
  edit_url?: string;
}

export interface NotionCreateResult {
  page_id: string;
  url: string;
}

interface NotionRichText {
  type: 'text';
  text: { content: string; link?: { url: string } | null };
}

function rt(content: string, link?: string): NotionRichText {
  const node: NotionRichText = { type: 'text', text: { content } };
  if (link) node.text.link = { url: link };
  return node;
}

function heading(level: 1 | 2 | 3, content: string): Record<string, unknown> {
  const type = `heading_${level}` as const;
  return { object: 'block', type, [type]: { rich_text: [rt(content)] } };
}

function paragraph(parts: NotionRichText[] | string): Record<string, unknown> {
  const rich = typeof parts === 'string' ? [rt(parts)] : parts;
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: rich } };
}

function bullet(content: string): Record<string, unknown> {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [rt(content)] },
  };
}

function callout(emoji: string, content: string): Record<string, unknown> {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji },
      rich_text: [rt(content)],
    },
  };
}

function buildBlocks(summary: NotionIntakeSummary, env: NotionEnv): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];

  blocks.push(
    callout(
      '🤝',
      `Aeolistings client engagement workspace for ${summary.business_name}. Auto-created from intake submission ${summary.submitted_at_iso}.`,
    ),
  );

  blocks.push(heading(1, 'Engagement summary'));
  blocks.push(bullet(`Client: ${summary.business_name}`));
  blocks.push(bullet(`Primary contact: ${summary.client_name} <${summary.client_email}>`));
  blocks.push(bullet(`Scope: ${summary.scope_summary}`));
  blocks.push(bullet(`Submitted: ${summary.submitted_at_iso}`));
  blocks.push(bullet(`Intake ID: ${summary.intake_id}`));
  if (summary.edit_url) {
    blocks.push(
      paragraph([rt('Magic link (resend if needed): '), rt(summary.edit_url, summary.edit_url)]),
    );
  }

  if (summary.primary_contact && Object.values(summary.primary_contact).some(Boolean)) {
    blocks.push(heading(2, 'Primary contact (Step 8)'));
    const pc = summary.primary_contact;
    if (pc.name) blocks.push(bullet(`Name: ${pc.name}`));
    if (pc.role) blocks.push(bullet(`Role: ${pc.role}`));
    if (pc.email) blocks.push(bullet(`Email: ${pc.email}`));
    if (pc.phone) blocks.push(bullet(`Phone: ${pc.phone}`));
  }

  if (summary.named_experts && summary.named_experts.length > 0) {
    blocks.push(heading(2, 'Named experts (for author bylines)'));
    for (const e of summary.named_experts) {
      const line = [e.name, e.title].filter(Boolean).join(' — ');
      if (line) blocks.push(bullet(line));
    }
  }

  if (summary.cities && summary.cities.length > 0) {
    blocks.push(heading(2, 'Service cities (Step 6)'));
    for (const c of summary.cities) blocks.push(bullet(c.name));
  }

  if (summary.credentials && summary.credentials.length > 0) {
    blocks.push(heading(2, 'Access methods (Step 5)'));
    blocks.push(
      callout(
        '🔐',
        'Metadata only. Actual credentials live in 1Password Business → Aeolistings Client Credentials.',
      ),
    );
    for (const c of summary.credentials) {
      blocks.push(bullet(`${c.credential_type}: ${c.method}${c.status ? ` (${c.status})` : ''}`));
    }
  }

  if (summary.files && summary.files.length > 0) {
    blocks.push(heading(2, 'Brand assets uploaded'));
    blocks.push(paragraph(`${summary.files.length} file(s) live in R2; sync to Drive when convenient.`));
    for (const f of summary.files) blocks.push(bullet(`${f.category}: ${f.filename}`));
  }

  blocks.push(heading(2, 'Next steps'));
  blocks.push(
    paragraph([
      rt('Duplicate the '),
      rt('master template', `https://www.notion.so/${env.NOTION_TEMPLATE_PAGE_ID.replace(/-/g, '')}`),
      rt(' under this page to expand the full engagement workspace (Engagement Overview, Content Calendar, etc.).'),
    ]),
  );

  return blocks;
}

async function notionFetch(
  env: NotionEnv,
  path: string,
  init: RequestInit,
): Promise<unknown> {
  const fetcher = env.fetcher ?? fetch;
  const res = await fetcher(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.NOTION_INTEGRATION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`notion ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`notion ${path} returned non-JSON`);
  }
}

/**
 * Create a child page under NOTION_PARENT_PAGE_ID containing the intake
 * engagement summary. Returns the new page's id + Notion URL.
 */
export async function createClientPageTree(
  env: NotionEnv,
  summary: NotionIntakeSummary,
): Promise<NotionCreateResult> {
  const title = `${summary.business_name} — Aeolistings Engagement`;
  const body = {
    parent: { type: 'page_id', page_id: env.NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '🤝' },
    properties: {
      title: { title: [rt(title)] },
    },
    children: buildBlocks(summary, env),
  };
  const result = (await notionFetch(env, '/pages', {
    method: 'POST',
    body: JSON.stringify(body),
  })) as { id?: string; url?: string };
  if (!result.id) throw new Error('notion /pages response missing id');
  return {
    page_id: result.id,
    url: result.url ?? `https://www.notion.so/${result.id.replace(/-/g, '')}`,
  };
}
