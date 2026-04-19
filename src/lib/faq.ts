/**
 * Home-page FAQ.
 * Doubles as FAQPage JSON-LD — structured Q&A is prime AEO fuel.
 * Write concise, factual, entity-dense answers. Lead with the answer.
 * [PLACEHOLDER answers — tune once positioning is finalized]
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const faq: FAQItem[] = [
  {
    question: 'What is Answer Engine Optimization (AEO)?',
    answer:
      'Answer Engine Optimization (AEO) is the practice of structuring a business\'s content, metadata, and entity signals so that large language models — including ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews — return it as the synthesized answer to buyer-intent questions. AEO differs from SEO in that it targets generated answers rather than ranked link lists.',
  },
  {
    question: 'How is AEO different from SEO?',
    answer:
      'SEO optimizes for ranked search-result pages; AEO optimizes for the single synthesized answer an LLM produces. SEO rewards link authority and keyword match. AEO rewards clear entity definitions, structured data, atomic factual paragraphs, and retrievable content chunks that answer specific questions directly.',
  },
  {
    question: 'Which answer engines does AEO Listings optimize for?',
    answer:
      'AEO Listings optimizes for ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews, plus emerging answer surfaces such as Arc Search and SearchGPT. We tailor tactics per engine because each has distinct retrieval, citation, and ranking behavior.',
  },
  {
    question: 'How does AEO Listings measure results?',
    answer:
      'We build a custom prompt set around your buyer journey and run it against major answer engines on a recurring schedule. Reports include citation share, answer sentiment, competitor presence, and shifts after model or surface updates.',
  },
  {
    question: 'What is the engagement model?',
    answer:
      'AEO Listings operates on a monthly retainer. There are no long-term contracts — clients cancel by emailing the agency. Engagement typically starts with a one-time Entity Foundation build, followed by an ongoing optimization retainer.',
  },
];
