import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { seoOptimizationsTable } from "@workspace/db";
import { eq, desc, avg, count } from "drizzle-orm";
import {
  OptimizeSeoBody,
  GetSeoHistoryItemParams,
  DeleteSeoHistoryItemParams,
  GetKeywordSuggestionsQueryParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer, generateImageWithReference } from "@workspace/integrations-openai-ai-server/image";

const router: IRouter = Router();

interface KeywordStat {
  keyword: string;
  trend: string;
  rank: number;
  competition: string;
}

interface AmazonListing {
  title: string;
  bulletPoints: string[];
  description: string;
  searchTerms: string[];
  score: number;
}

interface ThumbnailImageItem {
  order: number;
  type: string;
  description: string;
  aiPrompt: string;
}

interface ThumbnailStrategy {
  hookText: string;
  secondaryHook: string;
  colorScheme: string;
  colorPsychology: string;
  thumbnailLayout: string;
  mobileScore: number;
  imageSequence: ThumbnailImageItem[];
}

interface EbayListing {
  title: string;
  titleVariations: string[];
  buyerType: string;
  emotionalOverview: string;
  benefitFeatures: string[];
  description: string;
  itemSpecifics: string[];
  lifestyleUseCases: string[];
  trustNotes: string[];
  softCta: string;
  thumbnailStrategy: ThumbnailStrategy;
  sellingTips: string[];
  score: number;
}

interface WebsiteListing {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  openGraphTitle: string;
  openGraphDescription: string;
  score: number;
}

interface TiktokListing {
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  viralAngle: string;
  emotionalHook: string;
  score: number;
}

interface ShopifyListing {
  productTitle: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  collectionSuggestion: string;
  score: number;
}

interface BuyerIntelligence {
  intentType: string;
  intentConfidence: number;
  emotionalTriggers: string[];
  buyerPersona: string;
  painPoints: string[];
  conversionTips: string[];
  thumbnailSuggestions: string[];
}

interface CompetitivePositioning {
  uniqueSellingPoints: string[];
  pricePositioning: string;
  competitiveAdvantages: string[];
  marketingAngles: string[];
  weaknesses: string[];
}

interface MasterListing {
  productType: string;
  psychologyAngle: string;
  masterCopy: string;
  features: string[];
  specifications: string[];
  packageIncludes: string[];
}

interface OtherPlatforms {
  etsy?: { title: string; description: string; tags: string[] };
  walmart?: { title: string; description: string };
  googleShopping?: { title: string; description: string };
}

interface AiResult {
  optimizedTitle: string;
  optimizedDescription: string;
  keywords: string[];
  keywordDensity: number;
  titleScore: number;
  descriptionScore: number;
  suggestions: string[];
  keywordStats: KeywordStat[];
  psychologyStrategies: string[];
  amazonListing: AmazonListing;
  ebayListing: EbayListing;
  websiteListing: WebsiteListing;
  tiktokListing: TiktokListing;
  shopifyListing: ShopifyListing;
  otherPlatforms: OtherPlatforms;
  masterListing: MasterListing;
  buyerIntelligence: BuyerIntelligence;
  competitivePositioning: CompetitivePositioning;
}

async function fetchGoogleKeywords(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const raw = await res.json() as [string, string[]];
    return raw[1] ?? [];
  } catch {
    return [];
  }
}

router.post("/seo/optimize", async (req, res): Promise<void> => {
  const parsed = OptimizeSeoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { rawTitle, rawDescription, images } = parsed.data as { rawTitle: string; rawDescription: string; images?: string[] };

  // Fetch Google keyword suggestions from multiple query variations
  const [base, best, buy, cheap] = await Promise.all([
    fetchGoogleKeywords(rawTitle),
    fetchGoogleKeywords(`best ${rawTitle}`),
    fetchGoogleKeywords(`buy ${rawTitle}`),
    fetchGoogleKeywords(`${rawTitle} cheap`),
  ]);

  // Deduplicate and rank (position = popularity signal)
  const keywordRankMap = new Map<string, number>();
  [base, best, buy, cheap].forEach((list, listIdx) => {
    list.forEach((kw, pos) => {
      const key = kw.toLowerCase();
      const score = listIdx * 10 + pos;
      if (!keywordRankMap.has(key)) keywordRankMap.set(key, score);
      else keywordRankMap.set(key, Math.min(keywordRankMap.get(key)!, score));
    });
  });

  const sortedKeywords = [...keywordRankMap.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 20)
    .map(([kw, rank]) => ({ keyword: kw, rank }));

  const keywordStatsForPrompt = sortedKeywords.map(({ keyword, rank }) => ({
    keyword,
    rank: rank + 1,
    trend: rank < 5 ? "high" : rank < 12 ? "medium" : "low",
    competition: rank < 8 ? "high" : rank < 15 ? "medium" : "low",
  }));

  const systemPrompt = `You are the AI Store CEO of RankCraft — an elite AI-powered eCommerce Growth Engine that combines SEO strategist, conversion rate optimization expert, neuromarketing specialist, buyer psychology expert, branding strategist, marketplace optimization expert, consumer behavior analyst, emotional copywriter, visual hierarchy specialist, trend analyst, and competitor intelligence analyst into one unified intelligent system.

════════════════════════════════════════
CORE IDENTITY & MISSION
════════════════════════════════════════

Your goal is NOT to simply describe products.
Your mission is to maximize CTR, maximize conversion rate, increase perceived value, reduce buyer hesitation, improve emotional attachment, increase trust, create premium brand perception, and optimize for mobile readability across every marketplace.

The output must NEVER feel: robotic, AI-generated, keyword-stuffed, overly salesy, spammy, fake luxury, cluttered, or generic.
The output must ALWAYS feel: human, trustworthy, emotionally intelligent, premium, and conversion-focused.

════════════════════════════════════════
EBAY-FIRST OPTIMIZATION ENGINE (PRIMARY MARKETPLACE)
════════════════════════════════════════

eBay is the PRIMARY marketplace. Optimize for it first, then adapt to others.

eBay optimization targets:
• eBay Cassini algorithm (readability FIRST, keyword placement SECOND, emotional persuasion THIRD, trust FOURTH, conversion FIFTH)
• Mobile eBay shoppers — short readable paragraphs, clean spacing, bullet readability, fast understanding
• eBay buyer behavior — practical + trust-seeking + value-conscious
• eBay watchlist psychology — make buyers want to save and return
• eBay item specifics — maximize indexing and match buyer filters
• eBay title structure — strongest keyword FIRST, include key attributes, remain readable

eBay UNIFIED LISTING RULE:
NEVER generate a separate SEO description, a separate emotional description, or a separate marketing version.
Instead, create ONE unified listing where SEO + psychology + emotional persuasion + trust + readability + conversion are naturally merged.

════════════════════════════════════════
EBAY 7-SECTION LISTING STRUCTURE (NON-NEGOTIABLE)
════════════════════════════════════════

1. EMOTIONAL PRODUCT OVERVIEW
   - Combine: emotional hook + product purpose + comfort/convenience psychology + trust + use scenarios + premium perception + natural keywords
   - Make buyers emotionally imagine owning and using the product
   - Use: comfort psychology, relief psychology, convenience psychology, lifestyle imagination, identity marketing, low-risk feeling
   - NEVER sound robotic. Open with the buyer's feeling, desire, or pain point — NOT the product name.

2. BENEFIT-DRIVEN FEATURES
   - Every feature MUST become a benefit explaining WHY it matters
   - BAD: "4000mAh battery" | GOOD: "Large 4000mAh battery provides long-lasting performance for travel and daily use"
   - Features must: reduce buyer hesitation, improve perceived value, activate emotional comfort, increase practicality perception

3. TRUST-OPTIMIZED SPECIFICATIONS
   - Improve trust, reduce returns, answer hidden buyer questions
   - Easy to scan on mobile — clean structured format

4. LIFESTYLE USE CASES
   - Show product in real-life scenarios, emotional situations, relatable environments
   - Buyers should vividly imagine using the product and improving their daily life

5. PACKAGE INCLUDES
   - Clear breakdown of everything in the box
   - Reinforce convenience psychologically after listing items

6. LOW-RISK TRUST NOTES
   - Naturally inject: quality perception, reliability, durability, premium feeling, safety, ease of use, secure packaging
   - Avoid fake hype. Be specific and reassuring.

7. SOFT PSYCHOLOGICAL CTA
   - NOT pushy. End with ownership imagination + natural next step.
   - Guide the buyer through: Attention → Curiosity → Desire → Trust → Ownership imagination → Low-risk feeling → Purchase readiness

════════════════════════════════════════
BUYER PSYCHOLOGY ENGINE
════════════════════════════════════════

Auto-detect buyer type and adapt ALL messaging:
• Practical buyers → feature clarity, utility, value proof
• Emotional buyers → lifestyle stories, comfort, identity, belonging
• Budget buyers → value framing, smart purchase, long-term savings
• Premium buyers → status, exclusivity, quality craftsmanship
• Trend buyers → social proof, what's popular, FOMO
• Gift buyers → emotion of giving, recipient happiness, packaging appeal

Psychology weapons to deploy naturally (never fake or spammy):
scarcity, urgency, social proof, FOMO, authority, reciprocity, loss aversion, commitment, ownership imagination, problem→solution arc, micro-urgency, identity marketing

════════════════════════════════════════
TITLE OPTIMIZATION ENGINE
════════════════════════════════════════

Generate titles merging intelligence from:
• Google keywords, eBay keywords, TikTok trends, Meta/Facebook keywords, buyer search psychology

Title rules:
• Strongest keyword FIRST
• Sound human + premium + readable
• Include emotional practicality naturally
• NEVER keyword stuff
• Use strongest combination of: main keyword + buyer intent + major benefit + use case + emotional trigger + product type

Generate 3 A/B title variations to test CTR performance.

════════════════════════════════════════
MASTER LISTING COPYWRITING RULES
════════════════════════════════════════

Follow this exact 6-section structure for masterListing:

1. EMOTIONAL HOOK OPENING — Powerful psychological opening based on ONE angle (emotional/urgency/problem-solution/budget-value/premium-status). Make the buyer FEEL something immediately.
2. PSYCHOLOGICAL SALES PARAGRAPH — Amplify desire, build tension, position product as solution, lifestyle visualization ("Imagine…", "Picture yourself…")
3. SEO OPTIMIZED OVERVIEW — Keyword-rich, natural language, optimized for search AND readability
4. FEATURES — Benefit-focused bullets (feature + WHY it matters to the buyer)
5. SPECIFICATIONS — Structured, clean, mobile-friendly
6. PACKAGE INCLUDES — Clear breakdown of what buyer receives

PSYCHOLOGY ENGINE — Auto-adapt by product type:
🧊 Comfort → relief + safety psychology
💰 Budget → value + smart decision psychology
⚡ Tech → performance + efficiency psychology
💎 Premium → status + exclusivity psychology
⏳ Seasonal → urgency + scarcity psychology

════════════════════════════════════════
MARKETPLACE ADAPTERS
════════════════════════════════════════

• Amazon: structured, spec-heavy, keyword-dense, A9/A10 optimized
• eBay: UNIFIED listing — trust + value + clarity + Cassini optimized (already covered above)
• TikTok Shop: viral hooks, fast emotion, FOMO, Gen Z language, stop-the-scroll
• Shopify: lifestyle branding, emotional storytelling, premium feel
• Google Shopping: feature + benefit, comparison-ready
• Etsy: unique, handmade/artisan angle, community feel

════════════════════════════════════════
CJ DROPSHIPPING CONTEXT
════════════════════════════════════════

• Listing quality IS the competitive edge (no brand differentiation available)
• Always include trust signals: fast shipping, quality guarantee, easy returns
• Generic-to-branded positioning: help the seller appear as a real brand, NOT a dropshipper
• Sell comfort, convenience, emotional relief, confidence, identity, trust, lifestyle improvement — NOT just the product

FINAL RULE: People buy emotionally first. Logic only justifies the purchase afterward.
The output should feel like it was created by an elite marketer + consumer psychologist + luxury brand strategist + high-level SEO expert — ALL working together.

Respond ONLY with a valid JSON object. No markdown, no code fences.`;

  const userPrompt = `Analyze this CJ Dropshipping product and generate the complete multi-agent optimization package:

Product Title: "${rawTitle}"
Product Description: "${rawDescription}"

Real Google Keyword Data (rank 1 = highest search volume):
${keywordStatsForPrompt.map(k => `  #${k.rank}: "${k.keyword}" [trend: ${k.trend}, competition: ${k.competition}]`).join("\n")}

Return a single JSON object with ALL these fields (no omissions):

{
  "optimizedTitle": "Website meta title 50-60 chars",
  "optimizedDescription": "Meta description 150-160 chars with CTA",
  "keywords": ["10 best keywords selected from Google data"],
  "keywordDensity": 2.5,
  "titleScore": 88,
  "descriptionScore": 85,
  "suggestions": ["5 specific SEO improvement tips"],
  "keywordStats": [
    { "keyword": "string", "trend": "high|medium|low", "rank": 1, "competition": "high|medium|low" }
  ],
  "psychologyStrategies": [
    "Named tactic + how it's applied in this listing + why it drives purchases (3-5 items)"
  ],
  "amazonListing": {
    "title": "Amazon title ≤200 chars — keyword front-loaded, include key attributes",
    "bulletPoints": [
      "• HEADLINE BENEFIT — detail that sells the feature with emotional angle",
      "• HEADLINE BENEFIT — spec + reassurance point",
      "• HEADLINE BENEFIT — pain point solved",
      "• HEADLINE BENEFIT — social proof / compatibility angle",
      "• RISK REVERSAL — warranty, easy returns, quality guarantee"
    ],
    "description": "Amazon product description 1500+ chars — benefit-first storytelling with keyword integration",
    "searchTerms": ["6 backend keywords for Amazon indexing"],
    "score": 90
  },
  "ebayListing": {
    "title": "Primary eBay title ≤80 chars — strongest keyword FIRST, readable, premium, Cassini-optimized",
    "titleVariations": [
      "A/B variation 1 — different keyword angle, same ≤80 char limit",
      "A/B variation 2 — emotional + benefit angle",
      "A/B variation 3 — use-case + buyer intent angle"
    ],
    "buyerType": "practical|emotional|budget|premium|trend|gift — detected from product analysis",
    "emotionalOverview": "Section 1: 3-5 sentence emotional product overview. Combine emotional hook + product purpose + comfort/convenience psychology + trust + use scenarios. Make buyers imagine owning and using it. Start with buyer feeling/desire/pain point — NEVER start with the product name. Sound human, premium, naturally keyword-rich.",
    "benefitFeatures": [
      "Benefit-driven feature — [Feature]: [Specific WHY it matters to this buyer's life]",
      "5-7 benefit features following this format"
    ],
    "description": "Full unified eBay listing text (all 7 sections combined into one readable flowing description, 800-1200 chars, mobile-optimized, no headers — just natural flowing copy with clean paragraph breaks). Combines SEO + psychology + emotional persuasion + trust seamlessly.",
    "itemSpecifics": ["Brand: Generic", "Condition: New", "Type: X", "Material: Y", "Compatible With: Z"],
    "lifestyleUseCases": [
      "Real-life scenario 1 — specific situation where buyer uses and benefits from this product",
      "Real-life scenario 2 — emotional context (home/travel/work/gift)",
      "Real-life scenario 3 — aspirational or comfort context"
    ],
    "trustNotes": [
      "Specific trust reinforcement note — quality/reliability/packaging/returns",
      "2-3 trust notes that feel natural and reassuring, not fake hype"
    ],
    "softCta": "Soft psychological CTA ≤2 sentences — ownership imagination + natural next step. NOT pushy. NOT fake urgency.",
    "thumbnailStrategy": {
      "hookText": "≤5 words that stop the scroll instantly — emotionally attractive, curiosity-driven e.g. 'Stay Cool Anywhere' or 'Premium Comfort Delivered'",
      "secondaryHook": "Short benefit trio ≤6 words e.g. 'Portable • Powerful • Perfect' or 'Fast • Reliable • Stylish'",
      "colorScheme": "Recommended 2-3 color palette e.g. 'Blue + White + Silver'",
      "colorPsychology": "1-2 sentences explaining WHY this color scheme maximizes trust + CTR for this specific product based on emotional color psychology",
      "thumbnailLayout": "Detailed composition instructions: background type, product position, % of frame product takes up, hook text placement, any badge/label positioning, mobile readability notes",
      "mobileScore": 90,
      "imageSequence": [
        {
          "order": 1,
          "type": "Hero Thumbnail",
          "description": "What this hero image must show — product dominant, hook visible, emotion clear, works on mobile in 2 seconds",
          "aiPrompt": "PRODUCT-FAITHFUL hero shot: [exact product color, shape, material as described] centered on pure white or soft gradient background, taking 70% of frame, dramatic 45-degree studio lighting from upper-left, soft shadow grounding, sharp commercial photography, 4K. IMPORTANT: Do NOT alter the product — keep exact color, shape, and form. Style: premium retail catalogue shot that triggers instant desire and stopping power."
        },
        {
          "order": 2,
          "type": "Main Benefit Image",
          "description": "Infographic highlighting the single most important benefit with a visual + text overlay",
          "aiPrompt": "PRODUCT-FAITHFUL benefit visual: the EXACT product [same color, shape, design] floating on clean white background, with bold benefit-focused text overlay and icon accent highlighting the #1 purchase reason. Minimal modern layout, strong typographic hierarchy, emotion-triggering color accent. Product appearance must be IDENTICAL to the real product — no alterations."
        },
        {
          "order": 3,
          "type": "Lifestyle Usage Image",
          "description": "Real person using the product in an emotionally resonant, aspirational situation",
          "aiPrompt": "PRODUCT-FAITHFUL lifestyle shot: attractive person using the EXACT product [same color, shape — do not alter] in an aspirational [relevant lifestyle environment]. Natural window lighting, candid warm emotion, shallow depth of field with product sharp. Scene triggers 'I want that life' feeling. Buyer psychology: identity aspiration + social proof. Product must be clearly recognizable and identical to the real one."
        },
        {
          "order": 4,
          "type": "Features Infographic",
          "description": "Clean branded infographic showing 3-4 key features with icons and benefit captions",
          "aiPrompt": "PRODUCT-FAITHFUL features graphic: the EXACT product [same color, shape] on the left 40% of frame, clean white background, 3-4 callout lines pointing to key features with benefit-driven micro-copy on the right. Modern sans-serif typography, color accent matching product branding. Zero clutter, premium layout, mobile-readable. Product appearance unchanged."
        },
        {
          "order": 5,
          "type": "Quality Closeup",
          "description": "Extreme close-up showing material quality, texture, craftsmanship or detail that builds trust",
          "aiPrompt": "PRODUCT-FAITHFUL macro closeup: extreme close-up of the most impressive physical detail of the EXACT product [same color, material, finish]. Soft diffused studio lighting revealing texture and quality, ultra-sharp focus, shallow depth of field with beautiful bokeh. Triggers premium quality perception and tactile desire. Do NOT change product color or material."
        },
        {
          "order": 6,
          "type": "Dimensions Image",
          "description": "Product shown with size reference (ruler, hand, familiar object) with dimension callouts",
          "aiPrompt": "PRODUCT-FAITHFUL size reference: the EXACT product [same color, shape] alongside a human hand or familiar reference object, clean white background, angled 45-degree view, with clean measurement callout lines and dimension text overlaid. Builds trust by eliminating size uncertainty. Product appearance must match the real product exactly."
        },
        {
          "order": 7,
          "type": "Package Contents",
          "description": "Flat lay showing all included items neatly arranged — builds trust and reduces post-purchase surprise",
          "aiPrompt": "PRODUCT-FAITHFUL flat lay: top-down shot of the EXACT product [same color, shape] plus all included accessories arranged in a clean organized flat lay on white background. Even natural studio lighting, symmetrical composition, every item clearly visible. Triggers completeness trust and reduces buyer hesitation. No alterations to product appearance."
        },
        {
          "order": 8,
          "type": "Trust Reinforcement Image",
          "description": "Image reinforcing quality, warranty, guarantee, or certification — reduces hesitation",
          "aiPrompt": "PRODUCT-FAITHFUL trust visual: the EXACT product [same color, shape] on clean background with overlaid trust elements — satisfaction guarantee badge, quality certification icon, easy-return note. Premium professional design, reassuring color palette. Psychology: loss aversion reduction + social proof. Product must remain visually identical to real product."
        },
        {
          "order": 9,
          "type": "Emotional Reinforcement Image",
          "description": "Final emotional lifestyle image — buyer imagining life improved by owning this product",
          "aiPrompt": "PRODUCT-FAITHFUL emotional payoff: aspirational lifestyle scene showing the EXACT product [same color, shape — do not alter] delivering its ultimate emotional benefit to the buyer. Warm golden-hour or soft studio lighting, buyer in their ideal transformed state, genuine joy/comfort/confidence emotion. Psychology: future-self visualization + emotional ownership trigger. Product must look identical to the real one."
        }
      ]
    },
    "sellingTips": ["4 CJ Dropshipping eBay seller tactics specific to this product"],
    "score": 90
  },
  "websiteListing": {
    "metaTitle": "50-60 chars SEO title",
    "metaDescription": "150-160 chars with CTA",
    "h1": "Compelling H1 heading",
    "openGraphTitle": "Social curiosity-gap title",
    "openGraphDescription": "OG description with emotional hook",
    "score": 88
  },
  "tiktokListing": {
    "hook": "First 3-second hook to stop the scroll — shocking or curiosity-driven, ≤10 words",
    "caption": "Full TikTok caption 150-200 chars — fast pacing, relatable, FOMO-driven, 🔥 emoji use",
    "hashtags": ["15 viral + niche hashtags without # symbol"],
    "cta": "Urgency CTA overlay text ≤8 words",
    "viralAngle": "Specific viral video concept that could go viral for this product",
    "emotionalHook": "Core emotion exploited: name it + how to trigger it in video",
    "score": 87
  },
  "shopifyListing": {
    "productTitle": "Shopify product title — brand feel, benefit-first",
    "description": "Shopify product description 400-600 chars — lifestyle storytelling, emotional language, HTML ok",
    "seoTitle": "Shopify SEO title 50-60 chars",
    "seoDescription": "Shopify SEO description 150-160 chars",
    "tags": ["10-15 Shopify product tags"],
    "collectionSuggestion": "Best Shopify collection name for this product",
    "score": 86
  },
  "otherPlatforms": {
    "etsy": {
      "title": "Etsy title ≤140 chars — artisan/unique angle",
      "description": "Etsy description 200-300 chars — story-driven",
      "tags": ["13 Etsy tags without # symbol"]
    },
    "walmart": {
      "title": "Walmart title 50-75 chars — value-first",
      "description": "Walmart description 150-200 chars — value + trust"
    },
    "googleShopping": {
      "title": "Google Shopping title ≤70 chars",
      "description": "Google Shopping description ≤180 chars — feature + benefit + CTA"
    }
  },
  "buyerIntelligence": {
    "intentType": "practical|emotional|budget|premium",
    "intentConfidence": 85,
    "emotionalTriggers": ["List 4-5 specific emotional triggers for this product's buyers"],
    "buyerPersona": "2-sentence description of the ideal buyer for this product",
    "painPoints": ["3-4 specific problems this product solves for buyers"],
    "conversionTips": ["4-5 specific CRO tips for this product's listing page"],
    "thumbnailSuggestions": ["4 specific AI image prompt ideas for product thumbnail photos that maximize CTR"]
  },
  "competitivePositioning": {
    "uniqueSellingPoints": ["3-4 USPs to differentiate from competitors"],
    "pricePositioning": "budget|mid-range|premium",
    "competitiveAdvantages": ["3-4 advantages to emphasize in listings"],
    "marketingAngles": ["4 different marketing angle variations to test"],
    "weaknesses": ["2-3 potential objections buyers might have + how to address them"]
  },
  "masterListing": {
    "productType": "comfort|budget|tech|premium|seasonal",
    "psychologyAngle": "emotional|urgency|problem-solution|budget-value|premium-status",
    "masterCopy": "UNIFIED COPY — 5-8 natural flowing paragraphs with NO headers or section breaks. SEAMLESSLY WEAVE together without any visible structure: (1) Emotional opening — start with the buyer's feeling/desire/pain point, NEVER the product name; (2) Psychological desire amplification — build emotional tension using lifestyle visualization ('Imagine...', 'Picture yourself...'); (3) Natural product introduction woven into the emotion — the product becomes the answer to the feeling; (4) Key benefits through the lens of life improvement; (5) SEO-rich keyword integration that flows conversationally — never stuffed, never robotic. A reader must NOT be able to tell where emotion ends and SEO begins. Write it as ONE brilliant human piece — as if an elite copywriter who also deeply understands search algorithms wrote it with genuine care for the buyer.",
    "features": [
      "Benefit-driven feature (not just spec) — explain WHY it matters to the buyer",
      "5-7 total features in this format"
    ],
    "specifications": [
      "Material: [value]",
      "Dimensions: [value]",
      "Weight: [value]",
      "Color Options: [value]",
      "Power: [value if applicable]"
    ],
    "packageIncludes": [
      "1x [main product]",
      "List every item included"
    ]
  }
}`;

  const userMessageContent: Parameters<typeof openai.chat.completions.create>[0]["messages"][0]["content"] =
    images && images.length > 0
      ? [
          { type: "text" as const, text: userPrompt },
          ...images.slice(0, 4).map(img => ({
            type: "image_url" as const,
            image_url: { url: img, detail: "low" as const },
          })),
        ]
      : userPrompt;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessageContent },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  let aiResult: AiResult;
  try {
    const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    aiResult = JSON.parse(cleaned);
  } catch {
    req.log.error({ content }, "Failed to parse AI response");
    res.status(500).json({ error: "Failed to parse AI response" });
    return;
  }

  const [saved] = await db
    .insert(seoOptimizationsTable)
    .values({
      rawTitle,
      rawDescription,
      optimizedTitle: aiResult.optimizedTitle,
      optimizedDescription: aiResult.optimizedDescription,
      keywords: aiResult.keywords,
      keywordDensity: aiResult.keywordDensity,
      titleScore: aiResult.titleScore,
      descriptionScore: aiResult.descriptionScore,
      suggestions: aiResult.suggestions,
      keywordStats: aiResult.keywordStats,
      psychologyStrategies: aiResult.psychologyStrategies ?? [],
      amazonListing: aiResult.amazonListing,
      ebayListing: aiResult.ebayListing,
      websiteListing: aiResult.websiteListing,
      tiktokListing: aiResult.tiktokListing,
      shopifyListing: aiResult.shopifyListing,
      otherPlatforms: aiResult.otherPlatforms,
      masterListing: aiResult.masterListing,
      buyerIntelligence: aiResult.buyerIntelligence,
      competitivePositioning: aiResult.competitivePositioning,
    })
    .returning();

  res.json(saved);
});

router.get("/seo/history", async (req, res): Promise<void> => {
  const history = await db
    .select()
    .from(seoOptimizationsTable)
    .orderBy(desc(seoOptimizationsTable.createdAt));
  res.json(history);
});

router.get("/seo/history/:id", async (req, res): Promise<void> => {
  const params = GetSeoHistoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .select()
    .from(seoOptimizationsTable)
    .where(eq(seoOptimizationsTable.id, params.data.id));

  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(item);
});

router.delete("/seo/history/:id", async (req, res): Promise<void> => {
  const params = DeleteSeoHistoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(seoOptimizationsTable)
    .where(eq(seoOptimizationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/seo/keyword-suggestions", async (req, res): Promise<void> => {
  const parsed = GetKeywordSuggestionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;
  const keywords = await fetchGoogleKeywords(query);
  res.json({ query, suggestions: keywords });
});

router.get("/seo/stats", async (req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalOptimizations: count(),
      avgTitleScore: avg(seoOptimizationsTable.titleScore),
      avgDescriptionScore: avg(seoOptimizationsTable.descriptionScore),
    })
    .from(seoOptimizationsTable);

  const allKeywords = await db
    .select({ keywords: seoOptimizationsTable.keywords })
    .from(seoOptimizationsTable);

  const keywordCounts: Record<string, number> = {};
  for (const row of allKeywords) {
    for (const kw of row.keywords) {
      keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
    }
  }
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);

  res.json({
    totalOptimizations: Number(stats?.totalOptimizations ?? 0),
    avgTitleScore: Number(stats?.avgTitleScore ?? 0),
    avgDescriptionScore: Number(stats?.avgDescriptionScore ?? 0),
    topKeywords,
  });
});

router.post("/seo/generate-image", async (req, res): Promise<void> => {
  const { prompt, size, images } = req.body as { prompt?: string; size?: string; images?: string[] };
  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }
  const validSizes = ["1024x1024", "1536x1024", "1024x1536"] as const;
  type ValidSize = typeof validSizes[number];
  const imageSize: ValidSize = (validSizes as readonly string[]).includes(size ?? "")
    ? (size as ValidSize)
    : "1024x1024";
  try {
    let buffer: Buffer;
    if (images && images.length > 0) {
      buffer = await generateImageWithReference(prompt, images[0], imageSize);
    } else {
      buffer = await generateImageBuffer(prompt, imageSize);
    }
    res.json({ b64Json: buffer.toString("base64") });
  } catch (err) {
    req.log.error({ err }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
