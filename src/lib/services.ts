/**
 * Service offerings — single source of truth.
 * Referenced by the home page preview and /services page.
 *
 * Voice: editorial, plain English. Each service is named for the work, not
 * the outcome — outcomes are the headline of the page; services are the
 * mechanics. The four tracks compound: most clients run all four, but they
 * are independently coherent so a misfit shop can still buy just one.
 *
 * Structure follows the buyer journey: see it (Foundation) → improve
 * (Visibility) → reinforce (Authority) → maintain (Operations).
 */
export interface ServiceCalendarPhase {
  /** Day marker, e.g. "Day 30" or "Month 1". */
  marker: string;
  /** What ships at that marker. One sentence. */
  delivery: string;
}

export interface Service {
  id: string;
  num: string;          // "01", "02" — used as numbering
  name: string;
  tagline: string;      // one-line pitch — reads aloud well
  summary: string;      // 2–3 sentence summary in plain language
  deliverables: string[];
  /** 30/60/90 (or month-1/2/3) calendar of what the client sees. */
  calendar: ServiceCalendarPhase[];
}

export const services: Service[] = [
  {
    id: 'foundation',
    num: '01',
    name: 'Foundation',
    tagline: 'The basics done correctly, once, so the rest of the work has something to stand on.',
    summary:
      "Most local businesses are invisible to AI chatbots because their core data is inconsistent — the name, address, services, and hours don't match across the web. We rebuild your Google Business Profile, fix citation inconsistencies across the directories AI models actually read, and add structured data to your site so machines can parse you cleanly. One canonical record of your business, deployed everywhere it matters.",
    deliverables: [
      'Google Business Profile audit and rebuild — categories, services, attributes, hours, photos, Q&A',
      'Citation cleanup across the directory set the AI models actually weight',
      'Schema.org structured data deployed on every page of your site',
      'Duplicate listings resolved, unclaimed profiles claimed, NAP mismatches fixed',
      'A single canonical record of your business so every future change has one source of truth',
    ],
    calendar: [
      { marker: 'Day 30', delivery: 'Foundation audit document, GBP rebuilt, structured data deployed on core pages.' },
      { marker: 'Day 60', delivery: 'Citation cleanup completed across the priority directory set; duplicates resolved.' },
      { marker: 'Day 90', delivery: 'Monitoring in place; foundation moves into maintenance mode.' },
    ],
  },
  {
    id: 'visibility',
    num: '02',
    name: 'Visibility',
    tagline: 'Tracking where AI models cite you today and rebuilding the pages that should be cited tomorrow.',
    summary:
      "AI chatbots quote pages that read like answers. We build a prompt set of the questions your real customers ask, run it weekly across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overview, and identify the structural reasons your competitors get cited and you don't. Then we rewrite or build the pages that fix the gap — question-led headings, self-contained answers, retrievable shape.",
    deliverables: [
      'A prompt set of 40–200 buyer-intent questions tailored to your business',
      'Weekly tracking across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overview',
      'Citation share report — your share vs. three named competitors, by model',
      'Rewrites or net-new pages designed for direct-answer retrieval',
      'A monthly content roadmap that responds to citation movement',
    ],
    calendar: [
      { marker: 'Day 30', delivery: 'Prompt set finalized; baseline citation report delivered.' },
      { marker: 'Day 60', delivery: 'First batch of rebuilt or net-new pages live; second baseline run shows initial movement.' },
      { marker: 'Day 90', delivery: 'Content roadmap for months 4–6 delivered; citation share trending against named competitors.' },
    ],
  },
  {
    id: 'authority',
    num: '03',
    name: 'Authority',
    tagline: 'The off-site signals that tell models you are a real, trusted business, not a thin profile.',
    summary:
      "Reviews, earned mentions, and third-party citations are how AI models verify a business is real. We build a review velocity system, pursue editorial mentions on the sites your category's models already trust, and track sentiment of mentions — not just count. The work coordinates with whatever PR or community work you already do.",
    deliverables: [
      'Review velocity system — request cadence, response templates, recovery on negative reviews',
      'Earned mentions on third-party sites the AI models weight (industry directories, local press, association pages)',
      'Founder or business profile maintained on the platforms models read',
      'Sentiment tracking of mentions, not just count',
      'A quarterly outreach plan tied to your business calendar',
    ],
    calendar: [
      { marker: 'Day 30', delivery: 'Review system deployed; baseline review velocity measured.' },
      { marker: 'Day 60', delivery: 'First earned mentions placed or in motion; sentiment baseline established.' },
      { marker: 'Day 90', delivery: 'Authority dashboard added to monthly report; quarterly outreach plan delivered.' },
    ],
  },
  {
    id: 'operations',
    num: '04',
    name: 'Operations',
    tagline: 'The recurring work that keeps the first three services honest as the models shift.',
    summary:
      "ChatGPT releases a new model. Google updates AI Overviews. Perplexity changes its citation logic. The work above only stays effective if someone is watching, adjusting, and reporting. Operations is that someone — a senior practitioner running the prompt set monthly, responding to model behavior changes, and writing the report that goes to your inbox each month.",
    deliverables: [
      'Monthly prompt-set run and citation report delivered to your inbox',
      'Tactical response when models or surfaces update',
      'Ongoing content and schema refresh',
      'Quarterly written strategy review',
      'Direct email channel with your senior strategist',
    ],
    calendar: [
      { marker: 'Day 30', delivery: 'First monthly report delivered.' },
      { marker: 'Day 60', delivery: 'Second report shows movement against baseline; first tactical adjustment cycle complete.' },
      { marker: 'Day 90', delivery: 'Quarter-one review delivered; roadmap for the next 90 days agreed.' },
    ],
  },
];
