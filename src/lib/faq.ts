/**
 * Home-page FAQ.
 * Doubles as FAQPage JSON-LD — structured Q&A is prime AEO fuel.
 * Write concise, factual, entity-dense answers. Lead with the answer, not context.
 *
 * Voice: plain language. Answers are what a skeptical contractor asks you
 * at the end of a sales call — and the direct honest reply.
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const faq: FAQItem[] = [
  {
    question: 'How is this different from SEO?',
    answer:
      "SEO ranks your website higher in Google's list of blue links. Answer Engine Optimization (AEO) makes sure AI chatbots — ChatGPT, Google AI Overviews, Perplexity, Claude, Gemini — mention your business by name when a prospect asks them for a recommendation. SEO rewards backlinks and keywords. AEO rewards clear business information, structured data, and content written in a way the AI can cleanly quote. They're related disciplines, but they optimize for different surfaces.",
  },
  {
    question: 'Do I need to cancel my SEO provider to work with you?',
    answer:
      "No. We complement traditional SEO — we don't replace it. Most of our clients keep their SEO agency or in-house effort and add AEO on top. Google's map-pack, reviews, and organic search still matter. We focus on what SEO doesn't cover: the AI chatbot layer. Many of the signals we build, like consistent citations and structured data, also help your standard SEO.",
  },
  {
    question: 'How fast does this work?',
    answer:
      "You'll see the Local AI Audit results in the first two weeks — a clear picture of what AI chatbots say about your business today. Measurable movement in how often you're cited typically takes 60 to 90 days of active optimization. AI models recrawl and reindex on their own schedule, so changes compound over months, not days. We'll tell you honestly if we don't see early signal.",
  },
  {
    question: 'What if ChatGPT already recommends me?',
    answer:
      "That's a strong starting position. We audit it first — some businesses appear in AI answers by accident because of a single lucky citation, which makes the position fragile. We make those mentions bulletproof, expand the number of prompts you appear in, and track what your competitors are doing so you don't get displaced when the model updates.",
  },
  {
    question: 'Why a retainer instead of a one-time project?',
    answer:
      "AI models retrain and update constantly. A one-time optimization decays within three to six months as new competitors are cited and models reweight their sources. A retainer covers continuous monitoring, tactical adjustments when surfaces change, and ongoing content refreshes. It's month-to-month. You cancel by sending a single email. No contracts, no termination fees.",
  },
];
