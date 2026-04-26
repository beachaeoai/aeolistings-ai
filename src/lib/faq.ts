/**
 * Site-wide FAQ content. Single source of truth for the homepage teaser, the
 * full /faq page, and the FAQPage JSON-LD shipped on both.
 *
 * Why this structure: AI assistants retrieve and cite Q&A passages more
 * reliably than running prose. Each answer is written to be self-contained
 * and lift-able as a paragraph. Lead with the direct answer; nuance second.
 *
 * Voice: editorial, plain English. The honest reply a skeptical owner would
 * get at the end of a sales call. No hype, no exclamation points, no
 * unsubstantiated specifics (no published price, no time-bound promise).
 */
export interface FAQItem {
  question: string;
  answer: string;
  /** Show on the homepage FAQ teaser. Top 3 only. Full set lives at /faq. */
  homepage?: boolean;
}

export const faq: FAQItem[] = [
  {
    question: 'What is Answer Engine Optimization, in plain English?',
    answer:
      "When someone asks ChatGPT or Google's AI Overview for the best plumber in their area, the AI picks a few names and explains why. AEO is the work of making sure your business is one of those names — and that the reasons it lists are accurate. It's the recommendation layer that sits on top of search. We structure your site, citations, reviews, and reference content so the models have something correct to quote.",
    homepage: true,
  },
  {
    question: 'How is this different from SEO?',
    answer:
      "SEO earns blue links. AEO earns sentences inside an AI's answer. The work overlaps — both reward clear content, real reviews, and consistent citations — but the outputs differ. SEO optimizes for a results page a human scrolls. AEO optimizes for a paragraph a model writes. If you already rank well on Google, you have a head start. If you don't, AEO often moves faster than traditional SEO because the bar for being quotable is different from the bar for ranking #1.",
  },
  {
    question: 'How long before we show up in AI answers?',
    answer:
      "First mentions usually appear within 30 to 90 days. Stable, repeated mentions across ChatGPT, Perplexity, Gemini, and Google AI Overview take three to six months. Anyone promising results in two weeks is either lying or running a script that gets you penalized later. The models retrain and refresh on their own schedules, so some weeks you'll see fast jumps and other weeks nothing. We send a monthly visibility report so you can see the trend, not the noise.",
    homepage: true,
  },
  {
    question: 'What does this cost?',
    answer:
      "Retainers run from low four figures to high four figures monthly, depending on scope. We don't publish a single starting number because the work to reach the same outcome differs by market saturation, business size, and how much foundation work is needed up front. We'll quote a flat monthly number after a short call, and we'll tell you on the call if the math doesn't work for your business rather than walk you through a pitch. There's no setup fee, no annual contract, and no per-keyword pricing.",
    homepage: true,
  },
  {
    question: 'Why retainer instead of a one-time project?',
    answer:
      "The models change every few weeks. A site we optimize in April can drift by August because ChatGPT updated how it weighs reviews, or Perplexity started pulling from a new citation source. A one-time project would look great for a quarter and slowly stop working. The retainer covers ongoing monitoring, content refreshes, and citation maintenance. You can pause or stop any month — we'd rather earn the next month than lock you in.",
  },
  {
    question: 'Will this hurt my Google rankings?',
    answer:
      "No. Everything we do — schema markup, clearer service pages, consistent citations, real review collection — also helps traditional SEO. We don't use prompt-injection tricks, hidden text, or any of the tactics floating around social media that promise to manipulate the AI directly. Those work for a few weeks and the models patch them, often with a penalty attached. Our approach is the boring one: be the most accurate, well-cited answer to the question, and let the models find you.",
  },
  {
    question: 'What do you actually do each month?',
    answer:
      "Four things, roughly. One: monitor what ChatGPT, Claude, Perplexity, Gemini, and Google AI Overview say about you and your competitors. Two: update your site's structured data and reference pages so the models have current facts to cite. Three: build and maintain citations on the directories these models actually pull from — a shorter list than traditional SEO directories. Four: send a monthly report showing where you're being mentioned and where you're being skipped. No black-box dashboards.",
  },
  {
    question: 'What kinds of businesses is this a bad fit for?',
    answer:
      "E-commerce stores, national SaaS companies, and anyone whose customers don't ask AI for recommendations yet. We focus on local service businesses doing roughly $500K to $10M because that's where AI recommendations are already moving real revenue. If you're a solo operator under $200K, the retainer probably isn't worth it yet. If you sell B2B enterprise software, you need a different agency. We'd rather say so on the first call than waste your quarter.",
  },
  {
    question: 'How do I cancel?',
    answer:
      "Email hello@aeolistings.ai. No forms, no exit interview, no retention call. Cancellation takes effect at the end of the current billing month and you keep everything we've built — the schema, the content, the directory accounts are all yours. We don't hold work hostage. Most agencies make leaving painful because their model depends on it. Ours depends on the work being good enough that you don't want to.",
  },
  {
    question: 'How do you measure whether it is working?',
    answer:
      "Three signals, in order of importance. One: are you being named in AI answers for the queries that matter to your business? We test the same prompts monthly across five models. Two: are those mentions accurate — right services, right service area, right phone number? Three: is your site traffic from AI sources (ChatGPT referrals, Perplexity, Google AI Overview clicks) trending up? Lead volume is the lagging indicator. We track all three and show you the raw data, not a vanity score.",
  },
];

/** Subset rendered on the homepage teaser. Three is intentional: enough to
 * earn FAQPage schema weight on the homepage without bloating the scroll. */
export const homepageFaq: FAQItem[] = faq.filter((item) => item.homepage);
