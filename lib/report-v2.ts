import type { AuditInput } from "./types";

export type PageType =
  | "shopify_ecommerce"
  | "saas"
  | "service_lead_gen"
  | "course_coaching"
  | "agency_consulting"
  | "software_app"
  | "unknown";

export type ImpactLevel = "high" | "medium" | "low";
export type CheckStatus = "strong" | "medium" | "weak" | "missing";

export type ScoreBreakdownItem = {
  key: "clarity" | "offer" | "trust" | "cta" | "friction" | "objectionHandling";
  label: string;
  score: number;
  reason: string;
};

export type ConversionLeak = {
  title: string;
  impact: ImpactLevel;
  category: string;
  whyItHurts: string;
  whatToChange: string;
  betterExample: string;
};

export type RewriteItem = {
  type: "headline" | "subheadline" | "cta" | "value_proposition" | "trust_section" | "faq";
  before: string;
  after: string;
  whyThisWorks: string;
};

export type CategoryCheck = {
  label: string;
  status: CheckStatus;
  comment: string;
  recommendation: string;
};

export type PriorityFix = {
  title: string;
  reason: string;
  action: string;
};

export type ActionPlanItem = {
  day: number;
  title: string;
  action: string;
  expectedOutcome: string;
};

export type BuyerObjection = {
  objection: string;
  pageResponse: string;
};

export type FaqRecommendation = {
  question: string;
  answer: string;
};

export type AuditReportV2 = {
  version: "2.0";
  meta: {
    pageUrl: string;
    product: string;
    targetAudience: string;
    tier: "basic" | "pro";
    pageType: PageType;
    evidenceQuality: "strong" | "medium" | "limited";
    evidenceNote: string;
  };
  executiveSummary: {
    overallScore: number;
    oneSentenceDiagnosis: string;
    biggestOpportunity: string;
    whyItMatters: string;
    primaryAction: string;
  };
  scoreBreakdown: ScoreBreakdownItem[];
  topLeaks: ConversionLeak[];
  rewrites: RewriteItem[];
  categoryAudit: {
    pageType: PageType;
    summary: string;
    checks: CategoryCheck[];
  };
  priorityFixes: {
    quickWins: PriorityFix[];
    biggerFixes: PriorityFix[];
  };
  sevenDayPlan: ActionPlanItem[];
  buyerObjections: BuyerObjection[];
  faqRecommendations: FaqRecommendation[];
  adSocialHooks: string[];
  disclaimer: string;
};

export const REPORT_V2_SCHEMA_GUIDE = `
Return a valid JSON object with this exact shape:

{
  "version": "2.0",
  "meta": {
    "pageUrl": "string",
    "product": "string",
    "targetAudience": "string",
    "tier": "basic or pro",
    "pageType": "shopify_ecommerce | saas | service_lead_gen | course_coaching | agency_consulting | software_app | unknown",
    "evidenceQuality": "strong | medium | limited",
    "evidenceNote": "string"
  },
  "executiveSummary": {
    "overallScore": 0,
    "oneSentenceDiagnosis": "string",
    "biggestOpportunity": "string",
    "whyItMatters": "string",
    "primaryAction": "string"
  },
  "scoreBreakdown": [
    {
      "key": "clarity | offer | trust | cta | friction | objectionHandling",
      "label": "string",
      "score": 0,
      "reason": "string"
    }
  ],
  "topLeaks": [
    {
      "title": "string",
      "impact": "high | medium | low",
      "category": "string",
      "whyItHurts": "string",
      "whatToChange": "string",
      "betterExample": "string"
    }
  ],
  "rewrites": [
    {
      "type": "headline | subheadline | cta | value_proposition | trust_section | faq",
      "before": "string",
      "after": "string",
      "whyThisWorks": "string"
    }
  ],
  "categoryAudit": {
    "pageType": "shopify_ecommerce | saas | service_lead_gen | course_coaching | agency_consulting | software_app | unknown",
    "summary": "string",
    "checks": [
      {
        "label": "string",
        "status": "strong | medium | weak | missing",
        "comment": "string",
        "recommendation": "string"
      }
    ]
  },
  "priorityFixes": {
    "quickWins": [
      {
        "title": "string",
        "reason": "string",
        "action": "string"
      }
    ],
    "biggerFixes": [
      {
        "title": "string",
        "reason": "string",
        "action": "string"
      }
    ]
  },
  "sevenDayPlan": [
    {
      "day": 1,
      "title": "string",
      "action": "string",
      "expectedOutcome": "string"
    }
  ],
  "buyerObjections": [
    {
      "objection": "string",
      "pageResponse": "string"
    }
  ],
  "faqRecommendations": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "adSocialHooks": ["string"],
  "disclaimer": "string"
}
`;

function getTierRules(input: AuditInput) {
  if (input.tier === "pro") {
    return `
This is the Pro audit.

Positioning:
- Pro Audit = full conversion action plan.
- The customer paid for deeper analysis, more implementation detail, and more copy they can test.

Required depth:
- 3 top conversion leaks
- 6 score breakdown items
- 5 rewrite items
- 5 category-specific checks
- 3 quick wins
- 3 bigger fixes
- 7 day action plan
- 3 buyer objections
- 3 FAQ recommendations
- 4 ad/social hooks

Make the advice specific, practical, and implementation-ready.
`;
  }

  return `
This is the Basic audit.

Positioning:
- Basic Audit = quick diagnosis.
- The customer paid for a concise first-pass audit that identifies the biggest conversion blockers.
- Do not make Basic feel like the full Pro consulting report.

Required depth:
- 3 top conversion leaks
- 6 score breakdown items
- 3 rewrite items only: headline, CTA, value proposition
- categoryAudit must include pageType and summary, but categoryAudit.checks must be an empty array
- 3 quick wins
- priorityFixes.biggerFixes must be an empty array
- 7 day action plan, but each item must be short and direct
- buyerObjections must be an empty array
- faqRecommendations must be an empty array
- adSocialHooks must be an empty array

Keep the report concise, practical, and easy to scan.
`;
}

export function buildAuditPromptV2(input: AuditInput) {
  const pageCopy = input.pageCopy?.trim()
    ? input.pageCopy.trim()
    : "The user did not provide detailed page copy. Use the product, audience, page URL, and stated conversion problem to create a limited-information audit. Be explicit that evidence quality is limited.";

  return `
You are a senior conversion rate optimization consultant, landing page strategist, and direct-response copywriter.

Your task:
Generate a structured conversion audit for a customer's landing page, Shopify store, SaaS page, sales page, course page, or service page.

The output must be a valid JSON object only.
Do not include Markdown.
Do not wrap the JSON in code fences.
Do not add explanations outside the JSON.
Do not mention AI, language models, prompts, or generation process.

Language:
- Output everything in clear, professional English.
- Write for founders, marketers, Shopify store owners, SaaS builders, consultants, and service businesses.
- Keep each field concise and specific.

Customer input:
- Page URL: ${input.url}
- Product / service: ${input.product}
- Target audience: ${input.audience}
- Main conversion problem: ${input.problem}
- Page copy / extra context: ${pageCopy}
- Tier: ${input.tier}

${getTierRules(input)}

Report quality rules:
Evidence and truthfulness rules:
- Do not invent customer counts, review counts, testimonials, logos, company names, compliance certifications, guarantees, shipping policies, discounts, or performance lift percentages.
- Do not claim SOC 2, GDPR, HIPAA, encryption, money-back guarantees, free shipping, customer counts, review ratings, or revenue lift unless explicitly provided in the customer input.
- If proof is missing, recommend adding verified proof instead of fabricating it.
- Use conditional language when evidence is not provided, such as "If true, add..." or "Add verified customer proof such as..."
- For placeholders, use bracketed text like "[customer quote]", "[review count]", "[security certification if applicable]".
- Do not include exact conversion lift estimates such as "increase by 10-15%" unless user provided real analytics.
- Expected outcomes should be qualitative, not guaranteed numerical improvements.

Additional strict truthfulness rules:
- Do not use the phrase "if true" inside final copy examples such as headlines, CTAs, FAQs, hooks, or rewrite outputs. Use recommendation language instead, such as "State whether a credit card is required" or "Add verified setup-time copy."
- Do not invent exact security details such as encryption level, retention period, privacy policy wording, or compliance status. Recommend adding verified security details instead.
- Do not invent exact free-trial length, setup time, customer count, revenue lift, percentage lift, or time-saved claims.
- Never write fake proof as final landing-page copy.
- Never invent examples like "Used by 200+ teams", "saved 5 hours/week", "SOC 2 compliant", "GDPR compliant", "No credit card required", "setup in 2 minutes", or specific customer quotes unless provided by the user.
- Never invent money-back guarantees, satisfaction guarantees, free calls, discovery calls, trial lengths, demo lengths, offer terms, discounts, or risk reversals unless provided by the user.
- If a guarantee, refund policy, trial detail, or demo length is not provided, recommend adding verified terms instead of writing them as final copy.
- Do not invent fake customer results such as "booked 40% more demos" or "3x more leads". Recommend adding a real result only when verified.
- When proof is missing, recommend the type of proof to add, not the fake proof itself.
- Correct format: "Add verified customer logos only when verified."
- Correct format: "If true, add: setup takes less than [verified setup time]."
- Correct format: "Add [customer quote] from a real buyer."
- Incorrect format: "Used by 200+ sales teams."
- Incorrect format: "We are SOC 2 compliant."
- Incorrect format: "Saved 6 hours/week per rep."


R4 safety and professionalism rules:
- Do not use aggressive direct-response hype such as "crush", "skyrocket", "guaranteed", "double in 30 days", or "3x more".
- Do not create fake scarcity such as "limited spots", "only 5 slots left", or "claim your spot" unless explicitly provided by the customer.
- Do not create fake free offers such as "free strategy call", "free audit", "free consultation", or "15-minute call" unless explicitly provided by the customer.
- When suggesting scarcity, proof, guarantees, calls, demos, or trial terms, phrase them as recommendations: "Add real capacity limits if true" or "Clarify the actual demo process."
- Final copy examples should be safe, realistic, and verifiable.
- Prefer professional consultant language over hype.


R5 output quality rules:
- Do not use placeholders like [X%], [Client Name], [Company], [Verified Metric], or [customer quote] in final report copy.
- If proof is missing, write a recommendation, not fake final copy.
- Avoid unsupported phrases like "Double your demos", "without more ad spend", "free audit", "free strategy call", or "companies of all sizes" unless provided by the customer.
- Copy examples must be safe and believable without invented numbers, invented proof, invented free offers, or invented scarcity.
- Prefer: "Add verified customer proof near the CTA."
- Prefer: "Clarify the actual demo process."
- Prefer: "Use a measurable outcome only if the business can verify it."


R6 natural consultant language rules:
- When evidence is missing, do not write fake landing-page copy. Write consultant recommendations instead.
- Avoid awkward placeholder language such as "verified result", "actual offer", or "your verified offer".
- Prefer natural phrases:
  - "Add measurable proof only when verified."
  - "Use a CTA that matches the real next step."
  - "Clarify the actual demo or consultation process."
  - "Define the customer segment you serve best."
- CTA examples should be neutral unless the customer provided an exact offer:
  - Good: "Book a Demo"
  - Good: "Request a Conversion Assessment"
  - Good: "See How It Works"
  - Bad: "Claim Your Free Strategy Call"
  - Bad: "Get 3x More Demos"
  - Bad: "Book More Demos in 30 Days"


R7 deterministic delivery rules:
- The disclaimer field must be plain, professional, and non-random.
- For Basic, use this exact meaning: "This Basic audit is a quick diagnostic based on the information provided. Recommendations should be validated with page analytics, customer feedback, and A/B testing."
- For Pro, use this exact meaning: "This Pro audit is a strategy review based on the information provided. It does not guarantee specific results. Validate recommendations with page analytics, customer feedback, and A/B testing."
- Do not write phrases like "actual page content was not reviewed", "publicly available information", or "recommendations are inferred from limited information" in customer-facing copy.
- Do not invent business history, number of customers, number of landing pages analyzed, timeline promises, refund promises, call lengths, or implementation timelines.
- If a claim needs proof, write "Add measurable proof only when verified" rather than inventing the proof.


R8 Pro action-plan quality rules:
- For Pro audits, the sevenDayPlan must read like an implementation checklist, not generic advice.
- Each Pro day should include a concrete deliverable, such as:
  - rewrite hero headline and subheadline
  - add proof block near CTA
  - create FAQ section
  - update CTA copy
  - define tracking events
  - prepare A/B test variant
  - review analytics after launch
- Avoid vague day titles like "Improve messaging" or "Optimize page".
- Basic action plans can stay shorter and simpler.
- Pro action steps should be practical, specific, and executable within one day.


R9 point-of-view rules:
- Do not write from the service provider's first-person perspective unless the customer explicitly provided that wording.
- Avoid unsupported "we", "our", or "we have worked with..." claims.
- Write as a consultant advising the customer what their page should add, clarify, or test.
- Prefer "Add relevant customer proof only when verified" over "We have worked with similar companies."
- Prefer "Explain how the service adapts to the buyer's industry" over "We can tailor this to your vertical."
- Prefer "The page should clarify the process" over "Our process..."


Final Pro 7-day implementation plan rules:
- For Pro audits, the sevenDayPlan must feel like a practical implementation checklist.
- Each Pro day must have:
  - a specific deliverable in the title
  - an action that tells the user exactly what to change or create
  - an expectedOutcome that works as a success check, not a guaranteed business result
- Good Pro title examples:
  - Rewrite hero headline and subheadline
  - Add proof block near the first CTA
  - Create objection-handling FAQ section
  - Update CTA copy and next-step explanation
  - Set up conversion tracking checklist
  - Prepare A/B test variant
  - Review results and decide next iteration
- Avoid vague Pro titles like "Improve page", "Optimize copy", or "Review marketing".
- Do not promise numeric improvement in expectedOutcome. Use checks like "Visitors can understand the offer faster" or "The page now answers the main buying objection."


R10 neutral delivery rules:
- Do not write as if AI Conversion Clinic is providing custom consulting, case studies, calls, implementation support, or agency services.
- This product delivers an AI-generated audit report, not a guaranteed consulting engagement.
- Avoid phrases like "our team", "we'll show", "we have experience", "hands-on implementation support", or "contact our team" unless provided by the customer.
- Write recommendations about what the customer's page should clarify, add, or test.
- Keep the voice neutral, advisory, and product-safe.

Strict compactness rules:
- Keep every string field short.
- Do not write long paragraphs.
- Do not use markdown bullets inside JSON string values.
- Do not use newline characters inside JSON string values.
- oneSentenceDiagnosis, biggestOpportunity, primaryAction: max 150 characters each.
- whyItHurts, whatToChange, betterExample: max 180 characters each.
- before, after, whyThisWorks: max 180 characters each.
- category check comments and recommendations: max 160 characters each.
- action plan fields: max 140 characters each.
- FAQ answers: max 180 characters each.
- Ad/social hooks: max 100 characters each.
- Be specific, not generic.
- Every recommendation must explain what to change.
- Avoid vague advice like "improve messaging" unless followed by a concrete rewrite or action.
- Do not promise a specific conversion-rate increase.
- If page copy is limited, say so in meta.evidenceQuality and meta.evidenceNote.
- Infer the page type from the product, audience, URL, and problem.
- Scores must be realistic, not all high.
- The lowest score areas should align with the top conversion leaks.
- Overall score must be between 0 and 100.
- Every scoreBreakdown score must be between 0 and 100.
- The sevenDayPlan must contain exactly 7 items, day 1 through day 7.
- The report should feel like a practical consultant deliverable, not a generic chatbot answer.

Page type rules:
- Use "shopify_ecommerce" for ecommerce, physical products, DTC, online stores, product pages, carts, add-to-cart, ROAS, shipping, returns, or purchases.
- Use "saas" for SaaS, software subscriptions, demos, trials, B2B tools, integrations, onboarding, or product-led growth.
- Use "service_lead_gen" for service businesses, agencies, consultants, local services, lead forms, or booked calls.
- Use "course_coaching" for courses, coaching, info products, creators, training, or education offers.
- Use "agency_consulting" for agencies, consultants, fractional services, or expert-led offers.
- Use "software_app" for apps, tools, extensions, or utility software that are not clearly SaaS.
- Use "unknown" only when the page type cannot be inferred.

Category audit rules:
For shopify_ecommerce, check product clarity, offer clarity, trust proof, shipping/returns clarity, CTA/add-to-cart friction, urgency/reason to buy now.
For saas, check ICP clarity, problem clarity, outcome clarity, demo/trial CTA, social proof, integration/setup objections.
For service_lead_gen, check audience clarity, service outcome, proof/credibility, process clarity, contact CTA, risk reduction.
For course_coaching, check transformation clarity, audience fit, credibility, offer structure, objection handling, FAQ strength.
For agency_consulting, check positioning, proof, service packaging, lead capture CTA, process clarity, authority.
For software_app, check use-case clarity, onboarding promise, feature-to-outcome connection, trust, CTA, setup friction.

Required JSON schema:
${REPORT_V2_SCHEMA_GUIDE}

Return only the JSON object now.
`;
}

export function extractJsonObject(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in model output");
  }

  return trimmed.slice(first, last + 1);
}

export function parseAuditReportV2(text: string): AuditReportV2 {
  const json = extractJsonObject(text);
  return JSON.parse(json) as AuditReportV2;
}

export function isValidAuditReportV2(report: Partial<AuditReportV2>) {
  return Boolean(
    report &&
    report.version === "2.0" &&
    report.meta &&
    report.executiveSummary &&
    Array.isArray(report.scoreBreakdown) &&
    Array.isArray(report.topLeaks) &&
    Array.isArray(report.rewrites) &&
    report.categoryAudit &&
    report.priorityFixes &&
    Array.isArray(report.sevenDayPlan)
  );
}
