/**
 * Regional pages data — one entry per city we have a location page for.
 *
 * Each entry combines:
 *   - The unique city "hook" paragraph (the part that makes the page citable
 *     rather than templated; keep these specific and verifiable)
 *   - 3 city-specific Q&As (rendered as a per-page FAQPage on the route)
 *   - Source attribution for the hook fact (visible on the page + spot-
 *     checkable by anyone reading)
 *
 * The dynamic route at src/pages/locations/[city].astro pulls from this file
 * via getStaticPaths. To add a new city, add an entry below — no template
 * changes needed.
 *
 * IMPORTANT: do not ship a city page with a generic hook. The whole point of
 * regional pages is the unique paragraph; without it, the page becomes a
 * doorway page (Google + LLMs both penalize these). If a hook can't be
 * sourced and tied to AEO, kill the city instead of shipping filler.
 */

export interface LocationFaq {
  q: string;
  a: string;
}

export interface Location {
  /** URL slug — also the {city} param in the dynamic route. */
  slug: string;
  /** City name as shown in copy. */
  name: string;
  /** "Mesa, Arizona" — used in titles and the geo line under the H1. */
  fullName: string;
  /** Short metro descriptor used in meta titles, e.g. "East Valley". */
  metro: string;
  /** SEO meta title for the page. */
  metaTitle: string;
  /** SEO meta description (used as og:description too). */
  metaDescription: string;
  /** One-line lead under the H1 (1 sentence, the page's promise). */
  intro: string;
  /** The unique-per-city paragraph. ~90–130 words. */
  hookParagraph: string;
  /** Display label for the source (e.g. "U.S. Census Bureau"). */
  hookSourceLabel: string;
  /** Source URL — keep these to primary sources. */
  hookSourceUrl: string;
  /** Three city-specific Q&As, used both for the visible accordion and the FAQPage JSON-LD. */
  faq: LocationFaq[];
}

export const locations: Location[] = [
  // ─────────────────────────────────────────────────────────────────
  // 1. MESA — headquarters city
  //    Hook: entity-disambiguation problem caused by Mesa's size + place
  //    inside the larger Phoenix metro. Anchored to U.S. Census population.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'mesa',
    name: 'Mesa',
    fullName: 'Mesa, Arizona',
    metro: 'East Valley',
    metaTitle: 'Answer Engine Optimization in Mesa, AZ',
    metaDescription:
      'AEO for Mesa businesses — getting cited by ChatGPT, Claude, Perplexity, and Google AI Overview when prospects ask who to hire. Headquartered in Mesa, serving the East Valley and the United States.',
    intro:
      "We're headquartered in Mesa. The local market and the entity-disambiguation problems that come with it are the work we know best.",
    hookParagraph:
      "Mesa is the third-largest city in Arizona — population approximately 520,000, larger than Atlanta, Miami, or Pittsburgh — and unusually for a city that size, it sits inside a much larger metropolitan area where most consumer-facing search defaults to \"Phoenix\" rather than \"Mesa.\" For service businesses headquartered here, that creates a specific entity-disambiguation problem: AI chatbots have to decide whether a \"best plumber in Phoenix\" query should surface a Mesa-based business at all, and whether a \"Mesa contractor\" query should surface businesses that primarily describe themselves as serving the broader metro. Getting consistently cited as both a Mesa entity and a Phoenix-metro contender is exactly what AEO solves — and it's the work we've spent the most time on, because we live here.",
    hookSourceLabel: 'U.S. Census Bureau population estimates',
    hookSourceUrl: 'https://www.census.gov/quickfacts/fact/table/mesacityarizona',
    faq: [
      {
        q: 'Why does an AEO agency need to specialize in Mesa specifically?',
        a: "Mesa businesses face a structural identity problem most cities don't. Because Mesa sits inside the Phoenix metro, half of the relevant buyer-intent search volume uses \"Phoenix\" as the geographic qualifier (\"best HVAC in Phoenix\") and the other half uses \"Mesa\" specifically (\"plumber in Mesa\"). Generic optimization that targets one usually loses the other. The work has to deliberately establish you as both a Mesa entity AND a Phoenix-metro contender — which means coordinated entity signals, schema, citations, and content that map cleanly to both query patterns.",
      },
      {
        q: 'Do AI chatbots actually distinguish Mesa businesses from broader Phoenix businesses?',
        a: 'They try to, and the cleaner your entity signals are, the better they do. ChatGPT, Claude, and Perplexity all use a combination of structured data (Schema.org PostalAddress, Google Business Profile city fields), inbound citations (directories that name your city specifically), and on-page signals to determine which city a business is associated with. When those signals contradict each other — e.g., your GBP says Mesa but your homepage talks only about "the Valley" — the model defaults to whichever signal it weights highest, which is rarely the one you wanted.',
      },
      {
        q: "What's the most common AEO mistake we see in Mesa?",
        a: "Vague geographic copy. A surprising number of Mesa businesses describe themselves on their own website as serving \"the Valley\" or \"the Phoenix area\" without ever using the word Mesa in their main service descriptions. From an AI retrieval standpoint, that's invisible for Mesa-specific queries and weak for Phoenix-metro queries (because hundreds of competitors say the same thing). Specific city language, repeated consistently across the site and external citations, is one of the highest-ROI fixes for a Mesa-headquartered business.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. PHOENIX — replaced Perplexity's generic national stat with a
  //    Phoenix-specific market dynamic anchored to Census + AZ Office of
  //    Economic Opportunity growth data.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'phoenix',
    name: 'Phoenix',
    fullName: 'Phoenix, Arizona',
    metro: 'Phoenix metropolitan area',
    metaTitle: 'Answer Engine Optimization in Phoenix, AZ',
    metaDescription:
      'AEO for Phoenix businesses — getting cited by ChatGPT, Claude, Perplexity, and Google AI Overview in one of the densest, fastest-growing services markets in the United States.',
    intro:
      "Phoenix is the densest local-services market in the Southwest and one of the most AI-search-mature large metros in the country. Standing out is not optional.",
    hookParagraph:
      "Phoenix is the fifth-largest city in the United States and the anchor of a metropolitan area that has consistently added roughly 80,000 to 90,000 net new residents every year since 2020. Two consequences for local service businesses. First, the contractor market — especially HVAC, pool service, and roofing — is one of the densest in the country, because extreme heat creates year-round demand at a level most U.S. metros never see. Second, AI-search adoption among Phoenix newcomers is meaningfully higher than the national baseline, because most newcomers are coming from California, Texas, and Washington — the metros where ChatGPT and Perplexity adoption first crossed mainstream. Getting cited by AI chatbots in this market isn't a future concern. It is already costing businesses calls.",
    hookSourceLabel: 'U.S. Census Bureau & Maricopa Association of Governments',
    hookSourceUrl: 'https://www.census.gov/quickfacts/fact/table/phoenixcityarizona',
    faq: [
      {
        q: 'Is AI search big enough in Phoenix yet to actually move my business?',
        a: 'For most Phoenix service businesses we look at, the AI-cited share of buyer-intent traffic is somewhere between 5% and 15% of equivalent Google search volume — and growing roughly 30% to 50% per year. That is not the entire pipeline yet, but it is rising fast enough that the businesses ignoring it now will be visibly behind in 12 to 18 months. The Phoenix metro is also one of the U.S. markets where AI adoption is fastest, partly because of the in-migration patterns from California and Texas.',
      },
      {
        q: "How does Phoenix's heat-driven year-round HVAC market change AEO priorities?",
        a: "It compresses the consideration cycle. In most U.S. metros, an HVAC search happens twice a year (heating season, cooling season) and the prospect has time to compare. In Phoenix, an AC failure in July is a same-day emergency — and the buyer's first move is increasingly to ask ChatGPT \"who can come out today.\" That makes citation share for emergency-intent prompts disproportionately valuable here, and makes things like response-time signals, real-time availability data, and recent reviews more important to surface than they would be in a milder climate.",
      },
      {
        q: 'Should a Phoenix business optimize for "Phoenix" or for individual neighborhoods?',
        a: 'Both, in that order. The "Phoenix" geographic qualifier carries the largest search volume by a wide margin, so it has to be foundationally strong. But Phoenix is geographically enormous (roughly 520 square miles), and prospects increasingly include neighborhood qualifiers — Arcadia, Ahwatukee, Desert Ridge, North Central — when they want a local provider. The right pattern is consistent Phoenix-level signals across all your foundational pages, plus targeted neighborhood content for the specific areas you actually serve well.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. SCOTTSDALE — replaced Perplexity's marketing-blog source with
  //    Maricopa County / Zillow median-home-value data.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'scottsdale',
    name: 'Scottsdale',
    fullName: 'Scottsdale, Arizona',
    metro: 'East Valley',
    metaTitle: 'Answer Engine Optimization in Scottsdale, AZ',
    metaDescription:
      "AEO for Scottsdale's luxury-tier service market — getting cited by ChatGPT, Claude, Perplexity, and Google AI Overview when high-end buyers ask which contractor or professional to hire.",
    intro:
      'Scottsdale is a different services market from the rest of the metro. The buyer is different, the price points are different, and the right AEO posture is different.',
    hookParagraph:
      "Scottsdale's median home value sits well above $850,000 — roughly twice the Phoenix-metro average — and the local services market reflects it. A disproportionate share of Arizona's luxury remodelers, custom pool builders, high-end landscape designers, and concierge-tier home-service businesses are headquartered or primarily operating in Scottsdale. The buyers in this market also behave differently from typical residential prospects: they are more likely to ask ChatGPT or Perplexity for a recommendation than to phone-around, partly because they don't have time and partly because they are vetting based on the kind of evidence (project history, materials expertise, design portfolio) that a synthesized AI answer summarizes more usefully than a list of search results.",
    hookSourceLabel: 'Zillow Home Value Index, Scottsdale AZ',
    hookSourceUrl: 'https://www.zillow.com/home-values/29027/scottsdale-az/',
    faq: [
      {
        q: 'Do high-end Scottsdale buyers actually use ChatGPT to find contractors?',
        a: 'In our experience: yes, more than the average buyer for the same trade. The pattern we see most often is a Scottsdale buyer who has narrowed to two or three names through traditional channels (referral, Google search, Houzz) and then asks ChatGPT or Claude for a sanity check before reaching out — looking for specific signals like "which of these is known for Old Town remodels" or "which has the best track record on million-dollar-plus projects." Being the name that shows up favorably in those validation queries is often what closes the inquiry.',
      },
      {
        q: 'What signals do AI chatbots use to identify a Scottsdale business as luxury-tier?',
        a: 'Mostly signals you can shape. Project portfolios with named neighborhoods (Paradise Valley, Silverleaf, DC Ranch, McCormick Ranch, Old Town), price-point indicators in your own copy ("$2M+ remodels," "custom pool installations from $250K"), client-segment language ("luxury home builders," "estate-tier landscape design"), trade certifications and association memberships specific to high-end work, and reviews from named projects. Models cluster all of this into an inference about market tier — the cleaner and more consistent your signals, the less ambiguity there is.',
      },
      {
        q: 'How does AEO work for a Scottsdale business that also wants Paradise Valley clients?',
        a: 'Paradise Valley is a separate town legally but is treated as part of greater Scottsdale by most search behavior. The cleanest pattern is to anchor your primary entity in Scottsdale (where most of the actual market signal lives), then explicitly include Paradise Valley as part of your stated service area in schema, copy, and your Google Business Profile service-area settings. AI chatbots that retrieve answers for "best [trade] in Paradise Valley" will then surface you correctly — but only if the Paradise Valley signal is explicit, not implied.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. TEMPE — replaced Perplexity's affordable-housing angle (wrong
  //    audience) with the ASU + off-campus rental market dynamic.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'tempe',
    name: 'Tempe',
    fullName: 'Tempe, Arizona',
    metro: 'East Valley',
    metaTitle: 'Answer Engine Optimization in Tempe, AZ',
    metaDescription:
      "AEO for Tempe's services market — built around Arizona State University, off-campus rentals, parent buyers from out of state, and the SkySong tech corridor.",
    intro:
      "Tempe's services market is shaped by ASU more than any other single force. The buyer mix here doesn't look like the rest of the East Valley.",
    hookParagraph:
      "Tempe's defining feature for local service businesses is Arizona State University — the largest U.S. university by enrollment, with roughly 80,000 students, most of them living within a few miles of the Tempe campus. That creates a distinctive market shape: high-volume, repeat-cycle demand for plumbers, electricians, HVAC technicians, and locksmiths from a renter and landlord population that turns over every year, plus a parent-buyer segment purchasing condos for student housing who often default to AI search precisely because they are vetting from out of state and don't have local referrals. Tempe also concentrates more of the East Valley's tech-services workforce — through ASU SkySong and the Innovation Hubs cluster — than any other city in the metro, which skews how local prospects discover providers.",
    hookSourceLabel: 'Arizona State University enrollment data',
    hookSourceUrl: 'https://uoia.asu.edu/student-data',
    faq: [
      {
        q: "Does ASU's student market actually matter for AEO in Tempe?",
        a: 'For trades that serve rental housing — plumbing, electrical, HVAC, pest control, locksmiths, appliance repair — yes, significantly. Tempe rentals turn over every May and August, which means a predictable seasonal spike in service requests. The landlords managing these properties increasingly use AI search to find responsive providers, especially for emergency calls when a tenant reports a problem. Being cited as the go-to provider for rental property work in Tempe specifically is a real, measurable AEO target.',
      },
      {
        q: 'How do out-of-state parent buyers use AI search to find Tempe contractors?',
        a: "Parents buying student-housing condos in Tempe typically can't visit in person before closing, can't easily evaluate contractors from out of state, and don't have a local network. They turn to AI search for the same reason they would for any unfamiliar market: ChatGPT and Perplexity give them a synthesized recommendation faster than scrolling Yelp from another time zone. The contractors who show up favorably for queries like \"reliable HVAC for an investment property near ASU\" are the ones getting these calls — usually for ongoing maintenance, which is sticky revenue.",
      },
      {
        q: 'Is Tempe small enough that neighborhood-level AEO is worth it?',
        a: "Tempe is geographically small (roughly 40 square miles) but functionally has several distinct sub-markets — north Tempe near downtown, the Mill Avenue / ASU campus zone, south Tempe near Kyrene, west Tempe near the airport. Buyers do search with these qualifiers when relevant. For most service businesses, neighborhood-level optimization isn't the highest-ROI work in Tempe (the city is small enough that the citywide signal does most of the lift), but explicitly naming the sub-areas you serve well — in copy and in your service-area schema — meaningfully improves AI retrieval for the prospects who use those qualifiers.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. CHANDLER — kept Perplexity's Intel hook, lightly polished.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'chandler',
    name: 'Chandler',
    fullName: 'Chandler, Arizona',
    metro: 'East Valley',
    metaTitle: 'Answer Engine Optimization in Chandler, AZ',
    metaDescription:
      "AEO for Chandler's tech-driven services market — Intel, semiconductors, and the high-wage household concentration that comes with them. Getting cited by ChatGPT, Claude, Perplexity, and Google AI Overview.",
    intro:
      "Chandler is the East Valley's semiconductor hub. The buyer profile that creates is specific, well-paid, and disproportionately AI-search-native.",
    hookParagraph:
      "Chandler is the East Valley's semiconductor hub. Intel employs roughly 9,600 people in Arizona, the majority of them at the Chandler fab campus, and the multi-billion-dollar Intel Ocotillo expansion announced in 2021 has continued to bring high-wage technical workers into the city through 2025. The buyer profile this creates is specific and consequential for local service businesses: dense pockets of well-paid, time-poor households, most under forty, who default to ChatGPT or Perplexity for contractor recommendations rather than scrolling Google. Getting cited by AI in queries like \"best HVAC near Intel Ocotillo\" or \"pool builder Chandler\" is increasingly the gating signal in this market — not because Google doesn't matter, but because the buyer is checking AI first.",
    hookSourceLabel: 'Intel Corporation — Intel in Arizona',
    hookSourceUrl: 'https://www.intel.com/content/www/us/en/corporate-responsibility/intel-in-arizona.html',
    faq: [
      {
        q: 'Why does the Intel workforce in Chandler matter for AEO specifically?',
        a: "Two reasons. First, the population concentration: roughly 9,600 Intel employees plus their household members and the supplier-company workforce around them, mostly clustered south of Chandler in the Ocotillo and Price Corridor areas. That's a dense, well-defined buyer pool. Second, the demographic mix: technical workers, mostly under 40, with above-average household incomes and a much-higher-than-average tendency to use AI search as the first vetting tool. For trades that serve this pool — HVAC, pool builders, electricians, smart-home installers, premium landscapers — being the AI-cited recommendation is increasingly the gating step.",
      },
      {
        q: 'Should Chandler businesses optimize for "Chandler" or for the larger Phoenix metro?',
        a: 'Both, with Chandler weighted more heavily for most local trades. Chandler has more distinct civic identity than most East Valley cities — residents and prospects use "Chandler" specifically more often than they use "the East Valley" or "Phoenix" — so the city-level signal carries genuine search weight. Pair that with the broader metro for queries that don\'t use a city qualifier, and with neighborhood-level signal for the high-density sub-areas (Ocotillo, Price Corridor, downtown Chandler, south Chandler).',
      },
      {
        q: 'How do tech-worker prospects evaluate contractors differently?',
        a: "The patterns we see most often: they research more thoroughly before reaching out (more time on review sites, more time reading FAQs and process descriptions), they value clear written communication and online scheduling, they're more skeptical of vague pricing language, and they're more likely to validate a referral or Google result by asking ChatGPT for a sanity check. AEO work for businesses serving this market overlaps with what's just generally good marketing — clear, specific, well-organized information — but the specific signals AI models retrieve are slightly different, which is where the optimization layer matters.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. GILBERT — kept Perplexity's neighborhood-district hook, polished.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'gilbert',
    name: 'Gilbert',
    fullName: 'Gilbert, Arizona',
    metro: 'East Valley',
    metaTitle: 'Answer Engine Optimization in Gilbert, AZ',
    metaDescription:
      "AEO for Gilbert businesses — getting cited by ChatGPT, Claude, Perplexity, and Google AI Overview in a city built around walkable, named neighborhood districts where local-search behavior is unusually granular.",
    intro:
      'Gilbert is one of the few large U.S. cities where AEO has to be done at the neighborhood level to fully work. The districts are real, the buyers know them, and AI chatbots increasingly do too.',
    hookParagraph:
      "Gilbert is one of the few large U.S. cities that has built itself around walkable, master-planned neighborhood districts — Agritopia, the Heritage District, Epicenter, Cooley Station — each with its own concentration of restaurants, retailers, and local-serving businesses. The market consequence: Gilbert residents search for services with neighborhood-level specificity (\"dentist near Agritopia,\" \"landscaper Cooley Station,\" \"Heritage District restaurant\") at unusually high frequency for a city this size. AI chatbots that handle these queries weight signals like neighborhood-named pages, micro-area service descriptions, and proximity-based reviews far more than generic \"Gilbert, AZ\" targeting — which means the AEO work in Gilbert is more granular than in most metros.",
    hookSourceLabel: 'Discover Gilbert — Districts overview',
    hookSourceUrl: 'https://www.discovergilbert.com/dive-into-the-districts/',
    faq: [
      {
        q: "Does AI search actually recognize Gilbert's neighborhood districts?",
        a: 'Increasingly, yes. Agritopia, the Heritage District, and Cooley Station all have enough independent web presence — local press, Yelp listings, Google Maps annotations, neighborhood-association pages — that ChatGPT, Claude, and Perplexity can confidently cite businesses by district. Epicenter is newer and the recognition is patchier, but improving. For Gilbert businesses, this means explicitly naming your district in your own content (homepage, service pages, FAQ) is one of the highest-leverage moves available — the AI chatbots are ready to surface district-level results, but only for businesses giving them clean signal.',
      },
      {
        q: "What's actually different about AEO for Gilbert vs. Mesa or Chandler?",
        a: "The granularity. Mesa and Chandler are larger geographically and most buyer search uses citywide qualifiers. Gilbert is smaller and more district-organized, so a meaningful share of buyer-intent search includes a district name. That changes the optimization priorities — Gilbert businesses get more value from district-named landing pages and explicit district-area schema than they would in a city where the citywide signal does most of the work. The other difference: Gilbert's buyer culture skews toward \"shop local\" preference, which AI chatbots interpret partly through how often a business is described as locally-rooted by independent sources.",
      },
      {
        q: 'How granular can AEO get — neighborhood-level, street-level?',
        a: "Neighborhood-level is the sweet spot in Gilbert. Street-level is too granular for any current AI retrieval system to weight meaningfully — and trying to over-target a single street usually hurts more than it helps because the resulting copy reads as keyword stuffing. The right unit of work in Gilbert is the named district: build clean, distinctive content for each district where you actually do business, name those districts consistently across your site, GBP, and external citations, and let the AI chatbots do the matching.",
      },
    ],
  },
];

/** Lookup helper for the dynamic route. */
export function getLocationBySlug(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}
