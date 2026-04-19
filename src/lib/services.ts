/**
 * Service offerings — single source of truth.
 * Referenced by the home page preview and /services page.
 *
 * Voice: plain language for home service pros.
 * Structure follows the buyer journey: see it → fix it → build it → maintain it.
 */
export interface Service {
  id: string;
  num: string;          // "01", "02" — used as numbering
  name: string;
  tagline: string;      // one-line pitch — reads aloud well
  summary: string;      // 2–3 sentence summary in plain language
  deliverables: string[];
}

export const services: Service[] = [
  {
    id: 'local-ai-audit',
    num: '01',
    name: 'Local AI Audit',
    tagline: 'See exactly what AI chatbots say about your business right now.',
    summary:
      "We ask ChatGPT, Google AI, Perplexity, Claude, and Gemini the questions your customers actually ask — 'best plumber near me,' 'emergency roof repair,' 'HVAC replacement cost' — and report back what they say. Your name. Your competitors. The gaps. The fixes. You get a clear picture of where you stand before we do anything else.",
    deliverables: [
      'Fifty-plus buyer-intent prompts run across five major AI chatbots',
      'Citation share report — how often you appear vs. your three top competitors',
      'Gap analysis: where you should be getting mentioned but aren\'t',
      'Prioritized fix list with expected impact',
    ],
  },
  {
    id: 'get-listed-get-cited',
    num: '02',
    name: 'Get Listed, Get Cited',
    tagline: 'Build the signals AI chatbots need to trust and recommend you by name.',
    summary:
      "AI chatbots recommend businesses they can verify. We fix your Google Business Profile, align your business information across directories, add structured data to your website, and build the digital paper trail that makes AI models confident enough to name you when a prospect asks for a recommendation.",
    deliverables: [
      'Google Business Profile audit and rebuild',
      'Citation consistency cleanup across 30+ directories',
      'Schema.org structured data on every page of your site',
      'Canonical business description deployed consistently across the web',
    ],
  },
  {
    id: 'answer-ready-pages',
    num: '03',
    name: 'Answer-Ready Pages',
    tagline: 'Write the pages AI quotes when recommending you.',
    summary:
      "AI doesn't read your website the way a person does. It extracts short factual passages and cites specific businesses. We rewrite your service pages, FAQs, and location pages so the AI can cleanly lift the right passage — with your business name attached — when answering a prospect's question.",
    deliverables: [
      'Rewrites of up to 25 key pages in answer-engine-ready structure',
      'FAQ expansion built around real buyer questions',
      'llms.txt file added to your site to guide AI crawlers',
      'Location pages for each of your primary service areas',
    ],
  },
  {
    id: 'retainer',
    num: '04',
    name: 'Ongoing Retainer',
    tagline: 'Stay ahead as AI keeps changing.',
    summary:
      "ChatGPT releases a new model. Google updates AI Overviews. Perplexity changes how it cites sources. We monitor every month, adjust when something shifts, and keep your business recommended where it matters. Month-to-month. Cancel by email anytime — no contracts.",
    deliverables: [
      'Monthly AI citation monitoring across all major chatbots',
      'Tactical response when models or surfaces update',
      'Ongoing content and schema refresh',
      'Direct email or Slack channel with your strategist',
    ],
  },
];
