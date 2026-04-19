/**
 * Service offerings — single source of truth.
 * Referenced by Home preview and the /services page.
 * [PLACEHOLDER copy] — refine once user provides actual positioning.
 */
export interface Service {
  id: string;
  num: string;          // "01", "02" — used as mono numbering
  name: string;
  tagline: string;       // one-line pitch
  summary: string;       // 2-3 sentence summary
  deliverables: string[];
}

export const services: Service[] = [
  {
    id: 'entity-foundation',
    num: '01',
    name: 'Entity Foundation',
    tagline: 'Become a recognizable entity to every answer engine.',
    summary:
      'We build the canonical entity graph for your business — schema.org markup, knowledge-panel signals, consistent cross-site descriptions — so LLMs retrieve and synthesize you correctly instead of guessing.',
    deliverables: [
      'Full schema.org implementation (Organization, Service, FAQ, Article)',
      'Wikidata / Knowledge Graph alignment audit',
      'Canonical entity description refined across 20+ key surfaces',
      'Consistent NAP + identity data across the open web',
    ],
  },
  {
    id: 'answer-content',
    num: '02',
    name: 'Answer-Ready Content',
    tagline: 'Content structured for retrieval, not just ranking.',
    summary:
      'We rewrite and architect your content so that retrieval-augmented generation (RAG) systems chunk, cite, and quote you accurately. Question-led headings, atomic factual paragraphs, entity-dense intros.',
    deliverables: [
      'Site-wide content audit against RAG retrieval patterns',
      'Rewrites of top 25 pages to answer-engine-first structure',
      'FAQ and "People also ask" expansion sets',
      'llms.txt and LLM-specific content guidelines',
    ],
  },
  {
    id: 'measurement',
    num: '03',
    name: 'AEO Measurement',
    tagline: 'Know exactly where you appear in LLM answers.',
    summary:
      'Traditional rank tracking is blind to LLM surfaces. We run a recurring set of buyer-intent prompts across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews, and report on citation share, sentiment, and competitor presence.',
    deliverables: [
      'Custom prompt set built around your buyer journey',
      'Monthly LLM citation share + sentiment report',
      'Competitor appearance tracking across major answer engines',
      'Quarterly strategy review tied to measured shifts',
    ],
  },
  {
    id: 'retainer',
    num: '04',
    name: 'Ongoing Retainer',
    tagline: 'Answer engines move fast. We keep you ahead.',
    summary:
      'A recurring retainer covering content refresh, schema evolution, monitoring, and tactical response to model and surface changes. Cancel by email anytime — no lock-ins.',
    deliverables: [
      'Monthly optimization sprints',
      'New content drafted for emerging answer-intents',
      'Proactive response to model-update shifts',
      'Direct Slack or email channel with your strategist',
    ],
  },
];
