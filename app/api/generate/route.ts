import { createHash } from "crypto";
import { NextRequest } from "next/server";
import type { AuditInput } from "../../../lib/types";
import { Redis } from "@upstash/redis";
import { buildAuditPrompt, buildDiagnosisPrompt, buildSolutionPrompt } from "../../../lib/prompt";
import { verifyPaymentToken } from "../../../lib/payment-token";
import {
  buildAuditPromptV2,
  isValidAuditReportV2,
  parseAuditReportV2,
  type AuditReportV2
} from "../../../lib/report-v2";

export const runtime = "nodejs";

function validateInput(input: Partial<AuditInput>) {
  const required: Array<keyof AuditInput> = ["url", "product", "audience", "problem", "tier"];
  for (const key of required) {
    if (!input[key]) return `Missing field: ${key}`;
  }
  if (input.tier !== "basic" && input.tier !== "pro") return "Invalid report tier";
  return "";
}

function demoReport(input: AuditInput) {
  return `# AI Conversion Audit Report

## 1. Overall Score
Initial score: 68/100.

## 2. One-Sentence Diagnosis
The biggest issue is not traffic. The page does not make the audience, outcome, trust proof, and next step clear enough in the first few seconds.

## 3. Top Conversion Leaks
1. The headline may be too generic.
2. The page may not explain the buyer outcome clearly enough.
3. The CTA may not make the next step obvious.
4. Trust proof may be missing or too low on the page.
5. Buyer objections may not be handled before the CTA.

## 4. Headline Ideas
1. Find why your landing page is not converting.
2. Get a practical conversion audit before spending more on ads.
3. Turn page traffic into clearer next-step actions.

## 5. CTA Ideas
1. Generate my audit report.
2. Find my biggest conversion leak.
3. Show me what to fix first.

Customer input: ${input.product} / ${input.url}`;
}

function demoReportV2(input: AuditInput): AuditReportV2 {
  return {
    version: "2.0",
    meta: {
      pageUrl: input.url,
      product: input.product,
      targetAudience: input.audience,
      tier: input.tier,
      pageType: "unknown",
      evidenceQuality: "limited",
      evidenceNote: "This is a demo report because no AI provider key is configured."
    },
    executiveSummary: {
      overallScore: 68,
      oneSentenceDiagnosis: "The page likely explains the product, but does not make the buyer outcome and next step clear enough in the first few seconds.",
      biggestOpportunity: "Make the hero section more specific and move trust proof closer to the first CTA.",
      whyItMatters: "Visitors need to quickly understand whether the offer is for them, what result they get, and why they should act now.",
      primaryAction: "Rewrite the headline, subheadline, and CTA around a clearer buyer outcome."
    },
    scoreBreakdown: [
      { key: "clarity", label: "Clarity", score: 68, reason: "The offer direction is understandable, but the page likely needs a sharper first-screen message." },
      { key: "offer", label: "Offer Strength", score: 58, reason: "The value proposition may need more concrete outcomes and stronger differentiation." },
      { key: "trust", label: "Trust", score: 45, reason: "Trust proof should appear before or near the first conversion action." },
      { key: "cta", label: "CTA", score: 62, reason: "The CTA should describe the next step more clearly." },
      { key: "friction", label: "Friction", score: 55, reason: "Visitors may still have questions before taking action." },
      { key: "objectionHandling", label: "Objection Handling", score: 48, reason: "The page should handle common buyer doubts earlier." }
    ],
    topLeaks: [
      {
        title: "The hero message may be too generic",
        impact: "high",
        category: "Messaging",
        whyItHurts: "Visitors may understand the category, but not why this offer is the right choice for them.",
        whatToChange: "Make the headline specific to the audience, use case, and desired outcome.",
        betterExample: "Get a conversion audit that tells you exactly why visitors are not taking action."
      },
      {
        title: "Trust proof is not visible early enough",
        impact: "high",
        category: "Trust",
        whyItHurts: "If visitors do not trust the result, they will hesitate before paying or submitting details.",
        whatToChange: "Show a sample report, proof of what is included, and a clear disclaimer near the first CTA.",
        betterExample: "Add a short sample-report preview directly below the hero section."
      },
      {
        title: "CTA copy could be more specific",
        impact: "medium",
        category: "CTA",
        whyItHurts: "Generic CTAs create uncertainty about what happens next.",
        whatToChange: "Use action-oriented copy that describes the next step.",
        betterExample: "Generate my conversion audit"
      }
    ],
    rewrites: [
      {
        type: "headline",
        before: "AI conversion audit tool",
        after: "Find why your landing page is not converting",
        whyThisWorks: "It leads with the customer problem instead of the tool category."
      },
      {
        type: "cta",
        before: "Submit",
        after: "Generate my audit report",
        whyThisWorks: "It makes the outcome of the click clear."
      },
      {
        type: "value_proposition",
        before: "AI-powered landing page audit",
        after: "A practical conversion audit with page leaks, rewrites, objections, and a 7-day fix plan.",
        whyThisWorks: "It explains what the user actually receives."
      },
      {
        type: "faq",
        before: "No clear objection handling",
        after: "Will this guarantee higher conversion? No, but it gives actionable recommendations based on page clarity, offer strength, trust, and CTA flow.",
        whyThisWorks: "It reduces unrealistic expectations and builds trust."
      }
    ],
    categoryAudit: {
      pageType: "unknown",
      summary: "The page should be reviewed around clarity, offer strength, trust proof, CTA flow, and objection handling.",
      checks: [
        { label: "Audience clarity", status: "medium", comment: "The target audience may be implied but should be more explicit.", recommendation: "Name the exact buyer type in the hero or first supporting section." },
        { label: "Outcome clarity", status: "weak", comment: "The result may not be concrete enough.", recommendation: "Explain the practical outcome the user receives after checkout." },
        { label: "Trust proof", status: "weak", comment: "Trust needs to appear earlier.", recommendation: "Add sample report previews and clear expectations near the CTA." },
        { label: "CTA clarity", status: "medium", comment: "The next step can be clearer.", recommendation: "Use a CTA that describes the report generation action." },
        { label: "Objection handling", status: "weak", comment: "Common doubts may not be answered early enough.", recommendation: "Add FAQ items about accuracy, guarantees, and use cases." }
      ]
    },
    priorityFixes: {
      quickWins: [
        { title: "Rewrite the hero headline", reason: "It is the highest-leverage part of the page.", action: "Make it problem-led and outcome-specific." },
        { title: "Add sample report proof", reason: "Buyers want to know what they receive.", action: "Place a sample preview near the first CTA." },
        { title: "Improve CTA copy", reason: "Clear next-step language reduces hesitation.", action: "Use “Generate my audit report” or similar." }
      ],
      biggerFixes: [
        { title: "Add category-specific positioning", reason: "Different buyers care about different conversion issues.", action: "Create sections for Shopify, SaaS, services, and sales pages." },
        { title: "Add more trust proof", reason: "Paid self-serve tools need credibility quickly.", action: "Add screenshots, examples, and clear limitations." }
      ]
    },
    sevenDayPlan: [
      { day: 1, title: "Rewrite hero message", action: "Make the headline and subheadline more outcome-specific.", expectedOutcome: "Visitors understand the value faster." },
      { day: 2, title: "Improve CTA", action: "Replace generic CTA copy with a clearer next-step CTA.", expectedOutcome: "Less uncertainty before clicking." },
      { day: 3, title: "Add sample proof", action: "Show a sample report preview near the first CTA.", expectedOutcome: "Higher trust before payment." },
      { day: 4, title: "Add objections", action: "Add FAQ answers for guarantees, accuracy, and fit.", expectedOutcome: "Fewer unanswered doubts." },
      { day: 5, title: "Clarify use cases", action: "Add who the audit is best for.", expectedOutcome: "Better audience fit." },
      { day: 6, title: "Review mobile clarity", action: "Check whether the hero and CTA are clear on mobile.", expectedOutcome: "Better mobile comprehension." },
      { day: 7, title: "Test copy variation", action: "Test a sharper headline and CTA pair.", expectedOutcome: "A clearer version to compare against." }
    ],
    buyerObjections: [
      { objection: "Will this be too generic?", pageResponse: "Show the structured report sections and sample output before checkout." },
      { objection: "Will this guarantee higher conversion?", pageResponse: "Explain that it gives recommendations, not guaranteed results." },
      { objection: "Is this useful for my type of page?", pageResponse: "List the page types and use cases it supports." }
    ],
    faqRecommendations: [
      { question: "What do I receive?", answer: "A structured conversion audit with page leaks, rewrites, objections, FAQ ideas, hooks, and a 7-day plan." },
      { question: "Does this guarantee more sales?", answer: "No. It gives actionable recommendations, but results depend on traffic, offer, implementation, and testing." },
      { question: "What pages does it work for?", answer: "Landing pages, Shopify stores, SaaS pages, sales pages, course pages, and service pages." }
    ],
    adSocialHooks: [
      "Your landing page may be leaking buyers before they ever see your offer.",
      "Before spending more on ads, find the biggest page leak first.",
      "A clearer headline can beat a prettier redesign.",
      "Traffic is not enough if the page does not explain why to act now."
    ],
    disclaimer: "This audit provides actionable recommendations, but it does not guarantee a specific conversion rate increase. Results depend on traffic quality, offer strength, implementation, and testing."
  };
}

function hasEvidence(input: AuditInput, phrase: string) {
  const evidence = [
    input.product,
    input.audience,
    input.problem,
    input.pageCopy || "",
    input.url
  ].join(" ").toLowerCase();

  return evidence.includes(phrase.toLowerCase());
}

function inputContainsSpecificNumber(input: AuditInput, numberText: string) {
  const evidence = [
    input.product,
    input.audience,
    input.problem,
    input.pageCopy || "",
    input.url
  ].join(" ").toLowerCase();

  return evidence.includes(numberText.toLowerCase());
}

function sanitizeGeneratedClaim(value: string, input: AuditInput) {
  let text = value;

  const evidence = [
    input.product,
    input.audience,
    input.problem,
    input.pageCopy || "",
    input.url
  ].join(" ").toLowerCase();

  const has = (phrase: string) => evidence.includes(phrase.toLowerCase());

  // Do not invent compliance or security certifications.
  if (!has("soc 2")) text = text.replace(/\bSOC\s*2\b/gi, "a verified security certification");
  if (!has("gdpr")) text = text.replace(/\bGDPR\b/gi, "a verified privacy compliance claim");
  if (!has("hipaa")) text = text.replace(/\bHIPAA\b/gi, "a verified healthcare compliance claim");

  // Do not invent proof numbers, customer counts, ratings, or performance lifts.
  text = text.replace(/\b\d{2,4}\+\s+(customers|users|clients|teams|sales teams|companies)\b/gi, "verified customer proof");
  text = text.replace(/\bused by\s+\d{2,4}\+\s+([^.,;]+)/gi, "used by verified customers");
  text = text.replace(/\b\d+[-–]\d+\s+(known|real|verified)?\s*(customer|customers|teams|companies|logos)\b/gi, "verified customer proof");
  text = text.replace(/\b\d+\s+(customer|customers|teams|companies|logos)\b/gi, "verified customer proof");
  text = text.replace(/\b\d{2,4}\+\b/g, "verified count");

  text = text.replace(/\b\d{1,3}\s*[-–]\s*\d{1,3}%\b/g, "a verified performance lift");
  text = text.replace(/\b\d{1,3}%\b/g, "a verified percentage");

  // Do not invent setup time or time-saved claims.
  text = text.replace(/\bsetup\s+(in|under|within|less than)\s+\d+\s*(minutes?|mins?)\b/gi, "setup time if verified");
  text = text.replace(/\bset up\s+(in|under|within|less than)\s+\d+\s*(minutes?|mins?)\b/gi, "set up quickly if verified");
  text = text.replace(/\bunder\s+\d+\s*(minutes?|mins?)\b/gi, "under your verified setup time");
  text = text.replace(/\bless than\s+\d+\s*(minutes?|mins?)\b/gi, "within your verified setup time");
  text = text.replace(/\bin\s+\d+\s*(minutes?|mins?)\b/gi, "in your verified setup time");
  text = text.replace(/\b\d+\s*(minutes?|mins?)\b/gi, "your verified setup time");

  text = text.replace(/\b\d+(\.\d+)?\s*(hours|hrs)\s*(a|per|\/)?\s*(week|month|day)?\b/gi, "verified time saved");
  text = text.replace(/\b\d+(\.\d+)?\s*(hours|hrs)\/?(week|month|day)?\b/gi, "verified time saved");

  // Do not invent commercial terms.
  if (!has("no credit card")) {
    text = text.replace(/no credit card required/gi, "if true, no credit card required");
    text = text.replace(/no credit card/gi, "if true, no credit card");
  }

  if (!has("cancel anytime")) {
    text = text.replace(/cancel anytime/gi, "if true, cancel anytime");
  }

  if (!has("free shipping")) {
    text = text.replace(/free shipping/gi, "verified shipping offer");
  }

  // Remove ugly repeated conditional language.
  text = text.replace(/(if true,\s*){2,}/gi, "if true, ");
  text = text.replace(/If true,\s*if true,/gi, "If true,");
  text = text.replace(/if true,\s*If true,/gi, "if true,");
  text = text.replace(/if true,\s*if true/gi, "if true");
  text = text.replace(/If true,\s*If true/gi, "If true");

  // Convert placeholder-heavy phrases into customer-friendly wording.
  text = text.replace(/\[verified setup time\]/gi, "verified setup time");
  text = text.replace(/\[verified minutes\]/gi, "verified setup time");
  text = text.replace(/\[verified time amount\]/gi, "verified time saved");
  text = text.replace(/\[verified time saved\]/gi, "verified time saved");
  text = text.replace(/\[verified customer count\]/gi, "verified customer proof");
  text = text.replace(/\[verified count\]/gi, "verified count");
  text = text.replace(/\[verified performance lift\]/gi, "verified performance lift");
  text = text.replace(/\[security certification if applicable\]/gi, "verified security certification if applicable");
  text = text.replace(/\[privacy compliance if applicable\]/gi, "verified privacy compliance if applicable");

  // Clean fake quote patterns.
  text = text.replace(/—\s*[A-Z][a-z]+,\s*[^.]+/g, "— use a real customer quote here");
  text = text.replace(/–\s*[A-Z][a-z]+,\s*[^.]+/g, "– use a real customer quote here");

  // Make common recommendation patterns clearer.
  text = text.replace(/Add 'Setup in verified setup time'/gi, "Add a verified setup-time claim");
  text = text.replace(/Add 'Get started in verified setup time'/gi, "Add a verified setup-time claim");
  text = text.replace(/Start Free Trial\s*—\s*if true,\s*/gi, "Start Free Trial — ");
  text = text.replace(/Try Free\s*—\s*if true,\s*/gi, "Try Free — ");

  // Final production polish: make safe replacements readable.
  if (!has("256-bit") && !has("256 bit")) {
    text = text.replace(/\b256[- ]bit encryption\b/gi, "verified encryption details");
  }

  if (!has("encrypted at rest") && !has("encrypted in transit")) {
    text = text.replace(/\ball data is encrypted in transit and at rest\b/gi, "add verified encryption and data-handling details");
    text = text.replace(/\bencrypted in transit and at rest\b/gi, "verified encryption details");
    text = text.replace(/\bwe use encryption\b/gi, "state your verified encryption policy");
  }

  if (!has("30 days") && !has("30-day")) {
    text = text.replace(/\bdo not store recordings longer than \d+ days\b/gi, "state your verified recording retention policy");
    text = text.replace(/\bnot store recordings longer than \d+ days\b/gi, "state your verified recording retention policy");
    text = text.replace(/\bwithin \d+ days\b/gi, "within your verified timeframe");
    text = text.replace(/\b\d+[- ]day free trial\b/gi, "free trial");
    text = text.replace(/\b\d+[- ]day\b/gi, "verified timeframe");
  }

  text = text.replace(/\bclose verified percentage more deals\b/gi, "close more deals");
  text = text.replace(/\bclose a verified percentage more deals\b/gi, "close more deals");
  text = text.replace(/\bclose \d+% more deals\b/gi, "close more deals");
  text = text.replace(/\b\d+% more deals\b/gi, "more deals");

  text = text.replace(/\bStart Your Free Trial\s*—\s*if true,\s*no credit card required\b/gi, "Start Your Free Trial — clarify whether a credit card is required");
  text = text.replace(/\bStart Free Trial\s*—\s*if true,\s*no credit card required\b/gi, "Start Free Trial — clarify whether a credit card is required");
  text = text.replace(/\bTry Free\s*—\s*if true,\s*no credit card required\b/gi, "Try Free — clarify whether a credit card is required");

  text = text.replace(/\bAdd ['"]?if true,\s*no credit card required['"]?/gi, "Clarify whether a credit card is required");
  text = text.replace(/\bif true,\s*no credit card required\b/gi, "state whether a credit card is required");
  text = text.replace(/\bif true,\s*no credit card needed\b/gi, "state whether a credit card is required");
  text = text.replace(/\bif true,\s*cancel anytime\b/gi, "state cancellation terms clearly");

  text = text.replace(/\bunder your verified setup time\b/gi, "within your verified setup time");
  text = text.replace(/\bsetup in verified setup time\b/gi, "state verified setup time");
  text = text.replace(/\bset up in verified setup time\b/gi, "state verified setup time");
  text = text.replace(/\bStart free trial\s*[-–]\s*state whether a credit card is required\b/gi, "Start free trial — state whether a credit card is required");

  if (!has("salesforce") && !has("hubspot")) {
    text = text.replace(/\bSalesforce,\s*HubSpot,\s*and more\b/gi, "your CRM and related tools");
    text = text.replace(/\bHubSpot,\s*Salesforce,\s*and more\b/gi, "your CRM and related tools");
  }

  text = text.replace(/\bWe never share or sell it\b/gi, "State your verified data-sharing policy");
  text = text.replace(/\bWe never use your call recordings to train models\b/gi, "State your verified model-training policy");
  text = text.replace(/\bYou own all data\b/gi, "State verified data ownership terms");

  // Humanize remaining placeholders.
  text = text.replace(/\[customer logo\]/gi, "a real customer logo");
  text = text.replace(/\[customer logos\]/gi, "real customer logos");
  text = text.replace(/\[number\]/gi, "a verified number");
  text = text.replace(/\[time\]/gi, "verified time");
  text = text.replace(/\[verified time\]/gi, "verified time");
  text = text.replace(/\[verified setup time\]/gi, "verified setup time");
  text = text.replace(/\[verified minutes\]/gi, "verified setup time");
  text = text.replace(/\[X%\]/gi, "a verified result");
  text = text.replace(/\[Name\]/g, "a real customer name");
  text = text.replace(/\[Title\]/g, "their title");
  text = text.replace(/\[Company\]/g, "their company");
  text = text.replace(/\[Certification if applicable\]/gi, "your verified security certification, if applicable");
  text = text.replace(/\[security details if verified\]/gi, "verified security details");
  text = text.replace(/\[privacy policy\]/gi, "your privacy policy");
  text = text.replace(/\[relevant certifications if true\]/gi, "relevant verified certifications, if applicable");

  text = text.replace(/your verified setup time/gi, "the setup time you can truthfully verify");
  text = text.replace(/about the setup time you can truthfully verify/gi, "the setup time you can truthfully verify");
  text = text.replace(/in within/gi, "within");
  text = text.replace(/setup takes about the setup time you can truthfully verify/gi, "state the actual setup time clearly");
  text = text.replace(/Setup takes about the setup time you can truthfully verify/gi, "State the actual setup time clearly");
  text = text.replace(/Set up in under the setup time you can truthfully verify/gi, "State the actual setup time clearly");
  text = text.replace(/Start free trial — state whether a credit card is required/gi, "Start free trial — clarify whether a credit card is required");



  // Remove risky invented commercial promises and fake proof.
  const hasRiskReversal =
    has("guarantee") ||
    has("money back") ||
    has("refund") ||
    has("risk reversal") ||
    has("satisfaction guarantee");

  if (!hasRiskReversal) {
    text = text.replace(/\b100%\s+satisfaction\s+guarantee\b/gi, "add a verified risk-reversal statement if you truly offer one");
    text = text.replace(/\bsatisfaction\s+guarantee\b/gi, "add a verified risk-reversal statement if you truly offer one");
    text = text.replace(/\bmoney[- ]back\s+guarantee\b/gi, "add a verified refund policy only when verified");
    text = text.replace(/\byour money back\b/gi, "your verified refund policy only when verified");
    text = text.replace(/\bno[- ]risk\s+guarantee\b/gi, "verified risk-reversal statement only when verified");
  }

  const hasCallTerms =
    has("15-minute") ||
    has("15 minute") ||
    has("discovery call") ||
    has("free call") ||
    has("free consultation") ||
    has("demo call");

  if (!hasCallTerms) {
    text = text.replace(/\bfree\s+\d+[- ]?(minute|min)\s+(discovery\s+)?call\b/gi, "clarify your demo or consultation process honestly");
    text = text.replace(/\b\d+[- ]?(minute|min)\s+(demo|call|consultation|discovery call)\b/gi, "your verified demo or consultation length");
    text = text.replace(/\bfree\s+(discovery\s+)?call\b/gi, "your verified demo or consultation process");
    text = text.replace(/\bfree\s+consultation\b/gi, "your verified consultation process");
  }

  text = text.replace(/\bbook(ed)?\s+(a\s+)?verified percentage\s+more\s+(demos|calls|sales|leads)\b/gi, "add a real customer result only when verified");
  text = text.replace(/\b\d+x\s+more\s+(demos|calls|sales|leads|revenue)\b/gi, "a verified performance result");
  text = text.replace(/\bknown\s+SaaS\s+brand\b/gi, "a real customer only when verified");
  text = text.replace(/\bfrom their company\b/gi, "from a real customer");
  text = text.replace(/\bTrusted by\.\.\./gi, "Add verified customer proof only when verified");



  // Stronger production safety cleanup: remove invented guarantees, fake lifts, and unsupported offer terms.
  const hasVerifiedGuarantee =
    has("guarantee") ||
    has("guaranteed") ||
    has("money back") ||
    has("refund") ||
    has("risk reversal") ||
    has("satisfaction guarantee");

  if (!hasVerifiedGuarantee) {
    text = text.replace(/\b\d+\s*days?\s*[-–—]\s*guaranteed?\b/gi, "after you add a verified proof-backed claim");
    text = text.replace(/\bguaranteed?\b/gi, "only if you can verify this claim");
    text = text.replace(/\b100%\s+satisfaction\s+guarantee\b/gi, "a verified risk-reversal statement if you truly offer one");
    text = text.replace(/\bsatisfaction\s+guarantee\b/gi, "a verified risk-reversal statement if you truly offer one");
    text = text.replace(/\bmoney[- ]back\s+guarantee\b/gi, "a verified refund policy only when verified");
    text = text.replace(/\byour money back\b/gi, "your verified refund policy only when verified");
    text = text.replace(/\bno[- ]risk\s+guarantee\b/gi, "verified risk-reversal copy only when verified");
  }

  const hasVerifiedFreeOffer =
    has("free call") ||
    has("free consultation") ||
    has("free strategy call") ||
    has("free discovery call") ||
    has("free audit") ||
    has("15-minute") ||
    has("15 minute") ||
    has("strategy call") ||
    has("discovery call");

  if (!hasVerifiedFreeOffer) {
    text = text.replace(/\bfree\s+\d+[- ]?(minute|min)\s+(strategy|discovery|demo|consultation)?\s*call\b/gi, "your verified call or demo offer");
    text = text.replace(/\b\d+[- ]?(minute|min)\s+(strategy|discovery|demo|consultation)?\s*call\b/gi, "your verified call or demo length");
    text = text.replace(/\bfree\s+strategy\s+call\b/gi, "your verified consultation offer");
    text = text.replace(/\bfree\s+discovery\s+call\b/gi, "your verified consultation offer");
    text = text.replace(/\bfree\s+consultation\b/gi, "your verified consultation offer");
    text = text.replace(/\bfree\s+audit\b/gi, "your verified audit offer");
    text = text.replace(/\bclaim\s+your\s+free\b/gi, "request your");
    text = text.replace(/\bget\s+my\s+free\b/gi, "request my");
  }

  const hasVerifiedOutcomeProof =
    has("more demos") ||
    has("more leads") ||
    has("conversion lift") ||
    has("case study") ||
    has("results");

  if (!hasVerifiedOutcomeProof) {
    text = text.replace(/\bbook(ed)?\s+\d+%?\s*more\s+(demos|calls|sales|leads)\b/gi, "add a real customer result only when verified");
    text = text.replace(/\b\d+%?\s*more\s+(demos|calls|sales|leads|revenue)\b/gi, "a verified customer result");
    text = text.replace(/\b\d+x\s+more\s+(demos|calls|sales|leads|revenue)\b/gi, "a verified customer result");
    text = text.replace(/\b3x\s+more\b/gi, "a verified improvement");
    text = text.replace(/\b40%\s+more\b/gi, "a verified improvement");
  }

  const hasNoCommitment = has("no commitment") || has("no obligation") || has("no sales pitch");

  if (!hasNoCommitment) {
    text = text.replace(/\bno\s+commitment\b/gi, "clarify commitment expectations honestly");
    text = text.replace(/\bno\s+obligation\b/gi, "clarify the next step honestly");
    text = text.replace(/\bno\s+sales\s+pitch\b/gi, "clarify what happens after the CTA");
  }

  text = text.replace(/\btrusted by many companies\b/gi, "add verified customer proof only when verified");
  text = text.replace(/\btrusted by companies\b/gi, "add verified customer proof only when verified");
  text = text.replace(/\bknown SaaS brand\b/gi, "a real customer only when verified");
  text = text.replace(/\bclient logos\b/gi, "verified customer logos only when verified");
  text = text.replace(/\bcustomer logos\b/gi, "verified customer logos only when verified");
  text = text.replace(/\blogo row\b/gi, "verified proof row only when verified");

  // Clean awkward sanitizer leftovers.
  text = text.replace(/\bonly if you can verify this claim or your verified refund policy only when verified\b/gi, "only if backed by a verified refund policy");
  text = text.replace(/\bif it fits\b/gi, "if it is accurate");
  text = text.replace(/\bstate whether a credit card is required, free\b/gi, "state whether a credit card is required");


  // R4 final polish: remove aggressive sales claims and awkward sanitizer leftovers.
  text = text.replace(/\bverified\s+verified\b/gi, "verified");
  text = text.replace(/\byour verified audit offer\b/gi, "your actual offer");
  text = text.replace(/\byour verified call or demo offer\b/gi, "your actual call or demo process");
  text = text.replace(/\byour verified demo or consultation length\b/gi, "your actual call or demo length, if applicable");
  text = text.replace(/\byour verified consultation offer\b/gi, "your actual consultation offer, if applicable");
  text = text.replace(/\byour verified demo or consultation process\b/gi, "your actual demo or consultation process");
  text = text.replace(/\bverified customer logos only when verified\b/gi, "verified customer logos only when verified");
  text = text.replace(/\bverified proof row only when verified\b/gi, "verified proof row only when verified");

  // Remove unsupported time-bound performance promises.
  text = text.replace(/\bdouble\s+([^.,;]+?)\s+in\s+\d+\s+days?\b/gi, "improve $1 with verified proof and clearer page messaging");
  text = text.replace(/\bdouble\s+([^.,;]+?)\s+within\s+\d+\s+days?\b/gi, "improve $1 with verified proof and clearer page messaging");
  text = text.replace(/\bbook\s+more\s+demos\s+in\s+\d+\s+days?\b/gi, "increase demo intent with clearer proof and CTA copy");
  text = text.replace(/\bin\s+\d+\s+days?\b/gi, "after implementation and testing");

  // Remove unsupported scarcity and urgency claims.
  text = text.replace(/\bonly\s+\d+\s+(slots|spots|seats|places)\s+left\b/gi, "add real capacity limits only if true");
  text = text.replace(/\blimited\s+(slots|spots|seats|availability)\b/gi, "real capacity limits, if true");
  text = text.replace(/\bspots?\s+left\b/gi, "capacity limits if true");
  text = text.replace(/\bclaim your spot\b/gi, "request the next step");
  text = text.replace(/\bclaim your free\b/gi, "request your");

  // Remove unsupported free-call language.
  text = text.replace(/\bfree\s+\d+[- ]?min\s+(strategy|discovery|demo|consultation)?\s*call\b/gi, "your actual call or demo process");
  text = text.replace(/\bfree\s+\d+[- ]?minute\s+(strategy|discovery|demo|consultation)?\s*call\b/gi, "your actual call or demo process");
  text = text.replace(/\bfree\s+strategy\s+call\b/gi, "your actual consultation process");
  text = text.replace(/\bfree\s+discovery\s+call\b/gi, "your actual consultation process");
  text = text.replace(/\bfree\s+conversion\s+audit\b/gi, "your audit offer");
  text = text.replace(/\bfree\s+audit\b/gi, "your audit offer");

  // Make remaining conditional language sound like recommendations, not fake copy.
  text = text.replace(/\bif true,\s*/gi, "if accurate, ");
  text = text.replace(/\bif it is accurate\b/gi, "if accurate");
  text = text.replace(/\bstate whether a credit card is required\./gi, "clarify whether a credit card is required.");
  text = text.replace(/\bstate whether a credit card is required\b/gi, "clarify whether a credit card is required");
  text = text.replace(/\bclarify commitment expectations honestly\b/gi, "clarify what commitment, if any, is required");
  text = text.replace(/\bclarify the next step honestly\b/gi, "clarify what happens after the CTA");

  // Replace hype verbs with more professional language.
  text = text.replace(/\bcrush\b/gi, "improve");
  text = text.replace(/\bskyrocket\b/gi, "improve");
  text = text.replace(/\bexplode\b/gi, "increase");


  // R5 cleanup: remove remaining template placeholders and unsupported marketing promises.
  text = text.replace(/\bverified\s*%\b/gi, "verified result");
  text = text.replace(/\bverified metric\b/gi, "measurable verified outcome");
  text = text.replace(/\bverified percentage\b/gi, "verified result");
  text = text.replace(/\bby verified result\b/gi, "with a verified result");
  text = text.replace(/\bby a verified result\b/gi, "with a verified result");

  text = text.replace(/\[[^\]]+\]/g, (placeholder) => {
    const cleaned = placeholder.replace(/[\[\]]/g, "").trim().toLowerCase();

    if (cleaned.includes("%") || cleaned.includes("metric") || cleaned.includes("result") || cleaned.includes("x")) {
      return "a verified result";
    }

    if (cleaned.includes("client") || cleaned.includes("customer") || cleaned.includes("company") || cleaned.includes("name")) {
      return "a real customer only when verified";
    }

    if (cleaned.includes("quote") || cleaned.includes("testimonial")) {
      return "a real customer quote only when verified";
    }

    return "verified information";
  });

  // Remove unsupported "free" offer language unless the customer explicitly provided a free offer.
  const hasExplicitFreeOffer =
    has("free audit") ||
    has("free conversion audit") ||
    has("free trial") ||
    has("free consultation") ||
    has("free call") ||
    has("free demo") ||
    has("free assessment");

  if (!hasExplicitFreeOffer) {
    text = text.replace(/\bfree\s+conversion\s+audit\b/gi, "conversion audit");
    text = text.replace(/\bfree\s+audit\b/gi, "audit");
    text = text.replace(/\bfree\s+score\b/gi, "score");
    text = text.replace(/\bfree\s+assessment\b/gi, "assessment");
    text = text.replace(/\bfree\s+trial\b/gi, "trial details, if accurate");
    text = text.replace(/\bfree\s+demo\b/gi, "demo process, if accurate");
    text = text.replace(/\bclaim\s+your\s+free\b/gi, "request your");
    text = text.replace(/\bget\s+your\s+free\b/gi, "request your");
    text = text.replace(/\bget\s+my\s+free\b/gi, "request my");
  }

  // Replace unsupported aggressive growth promises with safer consultant language.
  text = text.replace(/\bdouble\s+your\s+([^.,;]+)/gi, "improve your $1 with clearer messaging and proof");
  text = text.replace(/\bdouble\s+([^.,;]+)/gi, "improve $1 with clearer messaging and proof");
  text = text.replace(/\bwithout\s+more\s+ad\s+spend\b/gi, "before increasing ad spend");
  text = text.replace(/\bwithout\s+more\s+ads\b/gi, "before increasing ad spend");
  text = text.replace(/\bincrease\s+your\s+sales\s+demo\s+conversion\s+by\s+a\s+verified\s+result\b/gi, "increase sales demo intent with clearer positioning and proof");
  text = text.replace(/\bincrease\s+your\s+sales\s+demo\s+conversion\s+with\s+a\s+verified\s+result\b/gi, "increase sales demo intent with clearer positioning and proof");
  text = text.replace(/\bmore\s+qualified\s+demos\s+per\s+week\b/gi, "more qualified demo intent");

  // Remove unsupported ICP and company-size claims.
  text = text.replace(/\bwe work with companies of all sizes\b/gi, "clarify which company sizes are the best fit");
  text = text.replace(/\bcompanies of all sizes\b/gi, "your best-fit customer segment");
  text = text.replace(/\bwith\s+\d+[-–]\d+\s+reps\b/gi, "in your stated ICP");
  text = text.replace(/\b5[-–]50\s+reps\b/gi, "your stated ICP");
  text = text.replace(/\bsimilar companies\b/gi, "real comparable customers only when verified");
  text = text.replace(/\bspecific metrics from real customers\b/gi, "verified customer metrics only when verified");
  text = text.replace(/\bspecific metrics from real comparable customers only when verified\b/gi, "verified customer metrics only when verified");

  // Make remaining proof recommendations cleaner.
  text = text.replace(/\bUsed by\s+a real customer only when verified\b/gi, "Add verified customer proof only when verified");
  text = text.replace(/\bfrom\s+a real customer only when verified\b/gi, "from a real customer only when verified");
  text = text.replace(/\bAdd\s+a real customer only when verified\b/gi, "Add a real customer example only when verified");
  text = text.replace(/\byour audit offer\b/gi, "your offer");
  text = text.replace(/\byour actual offer offer\b/gi, "your actual offer");


  // R6 natural-language polish: make safe replacements sound like consultant advice.
  text = text.replace(/\ba verified result\b/gi, "a measurable result you can support with proof");
  text = text.replace(/\bverified result\b/gi, "measurable proof");
  text = text.replace(/\bverified outcome\b/gi, "measurable proof");
  text = text.replace(/\bmeasurable verified outcome\b/gi, "measurable proof");

  text = text.replace(/\bGet your actual offer\b/gi, "Take the next step");
  text = text.replace(/\bBook your actual offer\b/gi, "Book the next step");
  text = text.replace(/\bBook your offer\b/gi, "Book the next step");
  text = text.replace(/\bGet your offer\b/gi, "Take the next step");
  text = text.replace(/\byour actual offer\b/gi, "the real next step");
  text = text.replace(/\byour offer\b/gi, "the real next step");

  text = text.replace(/\bBook Your Free Conversion Assessment\b/gi, "Request a Conversion Assessment");
  text = text.replace(/\bGet Your Free Conversion Assessment\b/gi, "Request a Conversion Assessment");
  text = text.replace(/\bFree Conversion Assessment\b/gi, "Conversion Assessment");
  text = text.replace(/\bfree conversion assessment\b/gi, "conversion assessment");

  text = text.replace(/\btypically with at least \d+\s+reps\b/gi, "after you define the customer segment you serve best");
  text = text.replace(/\bat least \d+\s+reps\b/gi, "your best-fit customer segment");
  text = text.replace(/\bin your stated ICP\b/gi, "for your stated ICP");

  text = text.replace(/\bUse a measurable outcome only if the business can verify it\b/gi, "Use measurable outcome language only when you can support it with proof");
  text = text.replace(/\bonly if you can truthfully verify this claim\b/gi, "only when the claim is accurate and supported by proof");
  text = text.replace(/\bonly if you truly offer one\b/gi, "only if the business truly offers it");
  text = text.replace(/\bif accurate, if accurate\b/gi, "if accurate");

  text = text.replace(/\bIncrease your sales demo conversion rates by measurable proof\b/gi, "Improve sales demo intent with clearer positioning and proof");
  text = text.replace(/\bIncrease your Sales Demo Conversion by measurable proof\b/gi, "Improve sales demo intent with clearer positioning and proof");
  text = text.replace(/\bincrease demo conversion rates with measurable proof\b/gi, "improve demo intent with clearer positioning and proof");

  text = text.replace(/\bStart Your Free Trial\b/gi, "Start Trial");
  text = text.replace(/\bStart Free Trial\b/gi, "Start Trial");


  // R7 delivery safety: remove remaining unsupported proof, timing, refund, and company-scale claims.
  text = text.replace(/\baverage client sees?\s+[^.,;]+/gi, "add real customer results only when verified");
  text = text.replace(/\bclients?\s+see(s)?\s+[^.,;]+/gi, "real customers may show measurable results if you have proof");
  text = text.replace(/\bwithin\s+\d+[-–]\d+\s+weeks?\b/gi, "after implementation and testing");
  text = text.replace(/\bwithin\s+\d+\s+weeks?\b/gi, "after implementation and testing");
  text = text.replace(/\bwithin\s+\d+\s+days?\b/gi, "after implementation and testing");

  text = text.replace(/\b\d+%[\+]?[\s-]*(lift|increase|improvement|conversion lift)\b/gi, "measurable proof only when verified");
  text = text.replace(/\b\d+%[\+]?/g, "measurable proof");
  text = text.replace(/\b\d+x\s+(more|increase|lift|growth|results?)\b/gi, "measurable proof only when verified");

  text = text.replace(/\bif you don'?t see improvement after\s+[^.,;]+/gi, "only include a refund or guarantee if the business truly offers it");
  text = text.replace(/\bwe'?ll refund\s+[^.,;]+/gi, "state the refund policy only if it truly exists");
  text = text.replace(/\brefund your investment\b/gi, "state the refund policy only if it truly exists");
  text = text.replace(/\bcomplete rebuild\b/gi, "larger implementation project");

  text = text.replace(/\bwe analyzed\s+\d+\+?\s+landing pages\b/gi, "add real experience proof only when verified");
  text = text.replace(/\banalyzed\s+\d+\+?\s+landing pages\b/gi, "real experience proof only when verified");
  text = text.replace(/\bwe have helped\s+[^.,;]+/gi, "add verified customer proof only when verified");
  text = text.replace(/\bwe specialize in\s+[^.,;]+/gi, "clarify your strongest customer segment");
  text = text.replace(/\bwe focus on\s+[^.,;]+/gi, "clarify your strongest customer segment");

  text = text.replace(/\bfor a\s+\d+[- ]?minute\s+audit\s+call\b/gi, "for the actual next step");
  text = text.replace(/\bfor a\s+\d+[- ]?minute\s+(call|demo|consultation)\b/gi, "for the actual next step");
  text = text.replace(/\b30[- ]?minute\s+audit\s+call\b/gi, "the actual next step");
  text = text.replace(/\b30[- ]?minute\s+(call|demo|consultation)\b/gi, "the actual next step");

  text = text.replace(/\bBook Your Conversion Strategy Call\b/gi, "Request a Conversion Review");
  text = text.replace(/\bBook a Conversion Strategy Call\b/gi, "Request a Conversion Review");
  text = text.replace(/\bClaim Your Free\b/gi, "Request Your");
  text = text.replace(/\bGet Your Free\b/gi, "Request Your");

  text = text.replace(/\bif true\b/gi, "if accurate");
  text = text.replace(/\bIf true\b/g, "If accurate");
  text = text.replace(/\bsaved\b/gi, "saved");
  text = text.replace(/\bverified saved\b/gi, "verified time saved only when verified");

  // Keep the final report note deterministic.
  text = text.replace(/\bActual page content was not reviewed\.?/gi, "");
  text = text.replace(/\bPage copy was not reviewed\.?/gi, "");
  text = text.replace(/\bRecommendations are inferred from limited information\.?/gi, "");
  text = text.replace(/\bThis audit is based on limited information[^.]*\./gi, "");


  // R8 final delivery polish.
  text = text.replace(/\brequired required\b/gi, "required");
  text = text.replace(/\bonly when verified\b/gi, "only when verified");
  text = text.replace(/\bif accurate if accurate\b/gi, "if accurate");
  text = text.replace(/\bif verified if verified\b/gi, "if verified");
  text = text.replace(/\bproof proof\b/gi, "proof");
  text = text.replace(/\bmeasurable proof proof\b/gi, "measurable proof");

  text = text.replace(/\bmore demos without increasing ad spend\b/gi, "more demo intent before increasing ad spend");
  text = text.replace(/\bwithout increasing ad spend\b/gi, "before increasing ad spend");
  text = text.replace(/\bwithout more ad spend\b/gi, "before increasing ad spend");
  text = text.replace(/\bturn more visitors into qualified leads\b/gi, "increase qualified lead intent");
  text = text.replace(/\bstop losing leads\b/gi, "reduce avoidable lead loss");
  text = text.replace(/\bstop optimizing and start converting\b/gi, "prioritize conversion-focused changes");
  text = text.replace(/\bfixed in 30 days\b/gi, "improved through implementation and testing");

  text = text.replace(/\boffer a low-commitment optin like a real next step\b/gi, "use a CTA that matches the real next step");
  text = text.replace(/\blike a real next step\b/gi, "that matches the real next step");
  text = text.replace(/\breal next step\b/gi, "actual next step");

  text = text.replace(/\bRequest Your\b/g, "Request");
  text = text.replace(/\bBook Your\b/g, "Book");
  text = text.replace(/\bGet Your\b/g, "Get");
  text = text.replace(/\bClaim Your\b/g, "Request");

  text = text.replace(/\bCTA button text\b/gi, "CTA copy");
  text = text.replace(/\bsubheadline\b/gi, "subheadline");


  // R9 final POV cleanup: remove first-person sales claims and leftover placeholder language.
  text = text.replace(/\bacross verified information\b/gi, "with verified customer proof only when verified");
  text = text.replace(/\bverified information\b/gi, "verified proof only when verified");
  text = text.replace(/\bverified information\./gi, "verified proof only when verified.");

  text = text.replace(/\bwe have worked with similar B2B teams\s+with verified customer proof only when verified\b/gi, "Add relevant customer proof from similar B2B teams only when verified");
  text = text.replace(/\bwe have worked with similar B2B teams\b/gi, "Add relevant customer proof from similar B2B teams only when verified");
  text = text.replace(/\bwe have worked with similar companies\b/gi, "Add relevant customer proof from similar companies only when verified");
  text = text.replace(/\bwe have helped similar companies\b/gi, "Add relevant customer proof from similar customers only when verified");

  text = text.replace(/\bhere'?s a case study from a similar company\s+verified proof only when verified\b/gi, "Add a real case study from a similar customer only when verified");
  text = text.replace(/\bhere'?s a case study from a similar company\b/gi, "Add a real case study from a similar customer only when verified");
  text = text.replace(/\bwe can also tailor this to your vertical\b/gi, "Explain how the service adapts to the buyer's industry or use case");
  text = text.replace(/\bwe tailor this to your vertical\b/gi, "Explain how the service adapts to the buyer's industry or use case");

  text = text.replace(/\btrusted by hundreds of companies\b/gi, "supported by verified customer proof only when verified");
  text = text.replace(/\btrusted by hundreds\b/gi, "supported by verified customer proof only when verified");
  text = text.replace(/\bhundreds of companies\b/gi, "verified customer proof only when verified");

  text = text.replace(/\bimprove lead-to-deal conversion by a measurable result you can support with proof\b/gi, "improve lead-to-deal conversion with measurable proof only when verified");
  text = text.replace(/\bby a measurable result you can support with proof\b/gi, "with measurable proof only when verified");
  text = text.replace(/\bby measurable proof\b/gi, "with measurable proof only when verified");

  text = text.replace(/\bOur process\b/gi, "The page should explain the process");
  text = text.replace(/\bour process\b/gi, "the process");
  text = text.replace(/\bWe analyze\b/gi, "The page should show how the offer analyzes");
  text = text.replace(/\bwe analyze\b/gi, "the page should show how the offer analyzes");
  text = text.replace(/\bWe help\b/gi, "The offer helps");
  text = text.replace(/\bwe help\b/gi, "the offer helps");
  text = text.replace(/\bWe work\b/gi, "The page should clarify who it works");
  text = text.replace(/\bwe work\b/gi, "the page should clarify who it works");


  // R10 final neutral consultant voice cleanup.
  text = text.replace(/\bWe have experience with SaaS, fintech, and professional services\./gi, "Add relevant industry-specific proof only when verified.");
  text = text.replace(/\bwe have experience with SaaS, fintech, and professional services\./gi, "add relevant industry-specific proof only when verified.");
  text = text.replace(/\bwe'?ll show relevant case studies\b/gi, "show relevant case studies only when verified");
  text = text.replace(/\bwe will show relevant case studies\b/gi, "show relevant case studies only when verified");
  text = text.replace(/\bContact our team\b/gi, "Use the appropriate contact path");
  text = text.replace(/\bcontact our team\b/gi, "use the appropriate contact path");
  text = text.replace(/\bhands-on implementation support\b/gi, "implementation support if offered");
  text = text.replace(/\bfull conversion audit, prioritized fix list, and hands-on implementation support\b/gi, "conversion audit, prioritized fix list, and implementation support if offered");
  text = text.replace(/\bThe scope is customized to your needs\b/gi, "Clarify the scope before checkout or booking.");
  text = text.replace(/\bthe scope is customized to your needs\b/gi, "clarify the scope before checkout or booking.");
  text = text.replace(/\btracking changes\b/gi, "tracking setup");
  text = text.replace(/\byour actual next step\b/gi, "the actual next step");

  // Clean spacing and awkward punctuation after replacements.
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/\s+\./g, ".");
  text = text.replace(/\(\s*\)/g, "");
  text = text.replace(/,\s*,/g, ",");
  text = text.replace(/\s+;/g, ";");


  return text.trim();
}

function sanitizeAuditReportV2(report: AuditReportV2, input: AuditInput): AuditReportV2 {
  function walk(value: unknown): unknown {
    if (typeof value === "string") {
      return sanitizeGeneratedClaim(value, input);
    }

    if (Array.isArray(value)) {
      return value.map(walk);
    }

    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        output[key] = walk(item);
      }
      return output;
    }

    return value;
  }

  return walk(report) as AuditReportV2;
}



function standardEvidenceNote(tier: AuditInput["tier"]) {
  if (tier === "pro") {
    return "Based on the URL, offer details, audience, problem, and page context provided by the customer.";
  }

  return "Based on the URL, offer details, audience, and problem provided by the customer.";
}

function standardImportantNote(tier: AuditInput["tier"]) {
  if (tier === "pro") {
    return "This Pro audit is a strategy review based on the information provided. It does not guarantee specific results. Validate recommendations with page analytics, customer feedback, and A/B testing.";
  }

  return "This Basic audit is a quick diagnostic based on the information provided. Recommendations should be validated with page analytics, customer feedback, and A/B testing.";
}

function shapeAuditReportForTier(report: AuditReportV2, tier: AuditInput["tier"]): AuditReportV2 {
  if (tier === "pro") {
    return {
      ...report,
      meta: {
        ...report.meta,
        tier: "pro",
        evidenceNote: standardEvidenceNote("pro")
      },
      topLeaks: report.topLeaks.slice(0, 3),
      rewrites: report.rewrites.slice(0, 5),
      categoryAudit: {
        ...report.categoryAudit,
        checks: report.categoryAudit.checks.slice(0, 5)
      },
      priorityFixes: {
        quickWins: report.priorityFixes.quickWins.slice(0, 3),
        biggerFixes: report.priorityFixes.biggerFixes.slice(0, 3)
      },
      sevenDayPlan: report.sevenDayPlan.slice(0, 7),
      buyerObjections: report.buyerObjections.slice(0, 3),
      faqRecommendations: report.faqRecommendations.slice(0, 3),
      adSocialHooks: report.adSocialHooks.slice(0, 4),
      disclaimer: standardImportantNote("pro")
    };
  }

  return {
    ...report,
    meta: {
      ...report.meta,
      tier: "basic",
      evidenceNote: standardEvidenceNote("basic")
    },
    topLeaks: report.topLeaks.slice(0, 3),
    rewrites: report.rewrites.slice(0, 3),
    categoryAudit: {
      ...report.categoryAudit,
      checks: []
    },
    priorityFixes: {
      quickWins: report.priorityFixes.quickWins.slice(0, 3),
      biggerFixes: []
    },
    sevenDayPlan: report.sevenDayPlan.slice(0, 7),
    buyerObjections: [],
    faqRecommendations: [],
    adSocialHooks: [],
    disclaimer: standardImportantNote("basic")
  };
}




function deliveryEvidenceNote(tier: AuditInput["tier"]) {
  if (tier === "pro") {
    return "Based on the URL, offer details, audience, conversion problem, and page context provided.";
  }

  return "Based on the URL, offer details, audience, and conversion problem provided.";
}

function deliveryImportantNote(tier: AuditInput["tier"]) {
  if (tier === "pro") {
    return "This Pro audit is a strategy review based on the information provided. It does not guarantee specific results. Validate recommendations with page analytics, customer feedback, and A/B testing.";
  }

  return "This Basic audit is a quick diagnostic based on the information provided. Recommendations should be validated with page analytics, customer feedback, and A/B testing.";
}

function finalizeAuditReportForDelivery(report: AuditReportV2, input: AuditInput): AuditReportV2 {
  const tiered = shapeAuditReportForTier(report, input.tier);

  return {
    ...tiered,
    meta: {
      ...tiered.meta,
      tier: input.tier,
      evidenceNote: deliveryEvidenceNote(input.tier)
    },
    disclaimer: deliveryImportantNote(input.tier)
  };
}

function formatReportV2AsText(report: AuditReportV2) {
  const isPro = report.meta.tier === "pro";
  const lines: string[] = [];

  const pageType = report.meta.pageType.replace(/_/g, " ");
  const reportTitle = isPro ? "Pro Fix Plan" : "Quick Fix Report";

  const addBlank = () => lines.push("");
  const addSection = (title: string) => {
    addBlank();
    lines.push(`## ${title}`);
  };

  lines.push(`# ${reportTitle}`);
  addBlank();
  lines.push(`Overall Score: ${report.executiveSummary.overallScore}/100`);
  lines.push(`Page Type: ${pageType}`);
  lines.push(`Evidence Quality: ${report.meta.evidenceQuality}`);
  addBlank();

  addSection("Executive Summary");
  lines.push(report.executiveSummary.oneSentenceDiagnosis);
  addBlank();
  lines.push(`Biggest Opportunity: ${report.executiveSummary.biggestOpportunity}`);
  lines.push(`Primary Action: ${report.executiveSummary.primaryAction}`);

  addSection("Score Breakdown");
  for (const item of report.scoreBreakdown.slice(0, 6)) {
    lines.push(`- ${item.label}: ${item.score}/100 — ${item.reason}`);
  }

  addSection("Top Conversion Leaks");
  for (const leak of report.topLeaks.slice(0, 3)) {
    lines.push(`- ${leak.title} (${leak.impact} impact): ${leak.whatToChange}`);
    lines.push(`  Why it matters: ${leak.whyItHurts}`);
    lines.push(`  Better example: ${leak.betterExample}`);
  }

  addSection(isPro ? "Before / After Copy Rewrites" : "Basic Copy Fixes");
  for (const item of report.rewrites.slice(0, isPro ? 5 : 3)) {
    lines.push(`- ${item.type.replace(/_/g, " ")}:`);
    lines.push(`  Before: ${item.before}`);
    lines.push(`  After: ${item.after}`);
    lines.push(`  Why this works: ${item.whyThisWorks}`);
  }

  if (isPro && report.categoryAudit.checks.length > 0) {
    addSection("Category-Specific Review");
    lines.push(report.categoryAudit.summary);
    for (const check of report.categoryAudit.checks.slice(0, 5)) {
      lines.push(`- ${check.label} (${check.status}): ${check.recommendation}`);
    }
  }

  addSection("Quick Wins");
  for (const fix of report.priorityFixes.quickWins.slice(0, 3)) {
    lines.push(`- ${fix.title}: ${fix.action}`);
  }

  if (isPro && report.priorityFixes.biggerFixes.length > 0) {
    addSection("Bigger Fixes");
    for (const fix of report.priorityFixes.biggerFixes.slice(0, 3)) {
      lines.push(`- ${fix.title}: ${fix.action}`);
    }
  }

  addSection(isPro ? "Detailed 7-Day Action Plan" : "Short 7-Day Action Plan");
  for (const day of report.sevenDayPlan.slice(0, 7)) {
    if (isPro) {
      lines.push(`Day ${day.day}: ${day.title}`);
      lines.push(`  Action: ${day.action}`);
      lines.push(`  Success check: ${day.expectedOutcome}`);
    } else {
      lines.push(`Day ${day.day}: ${day.title} — ${day.action}`);
    }
  }

  if (isPro && report.buyerObjections.length > 0) {
    addSection("Buyer Objections to Address");
    for (const item of report.buyerObjections.slice(0, 3)) {
      lines.push(`- ${item.objection}: ${item.pageResponse}`);
    }
  }

  if (isPro && report.faqRecommendations.length > 0) {
    addSection("FAQ Recommendations");
    for (const item of report.faqRecommendations.slice(0, 3)) {
      lines.push(`- ${item.question}: ${item.answer}`);
    }
  }

  if (isPro && report.adSocialHooks.length > 0) {
    addSection("Ad / Social Hooks");
    for (const hook of report.adSocialHooks.slice(0, 4)) {
      lines.push(`- ${hook}`);
    }
  }

  addSection("Important Note");
  lines.push(deliveryImportantNote(report.meta.tier));

  return lines.join("\n");
}



function normalizePaidReportPriceArtifacts(report: string) {
  let output = report;

  // Quick Fix Report is $9. Pro Fix Plan is $29.
  output = output.replace(/\$29\s+Quick\s+Fix\s+Report/gi, "$9 Quick Fix Report");
  output = output.replace(/\$29\s+Quick\s+Fix\b/gi, "$9 Quick Fix");
  output = output.replace(/Quick\s+Fix\s+Report\s*\(\s*\$29\s*\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/Quick\s+Fix\s*\(\s*\$29\s*\)/gi, "Quick Fix ($9)");
  output = output.replace(/Quick\s+Fix\s+Report\s*-\s*\$29/gi, "Quick Fix Report - $9");
  output = output.replace(/Quick\s+Fix\s*-\s*\$29/gi, "Quick Fix - $9");
  output = output.replace(/Quick\s+Fix\s+Report\s*=\s*\$29/gi, "Quick Fix Report = $9");
  output = output.replace(/Quick\s+Fix\s*=\s*\$29/gi, "Quick Fix = $9");
  output = output.replace(/Basic\s*\(\s*\$29\s*\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/\$29\s+Basic\b/gi, "$9 Quick Fix Report");

  // Keep comparison tables consistent.
  output = output.replace(/Quick Fix\s*\(\$9\)\s+Report/gi, "Quick Fix Report ($9)");
  output = output.replace(/Feature\s*-\s*Quick Fix\s*\(\$29\)\s*-\s*Pro Fix\s*\(\$29\)/gi, "Feature - Quick Fix ($9) - Pro Fix ($29)");
  output = output.replace(/Feature\s*-\s*Quick Fix Report\s*\(\$29\)\s*-\s*Pro\s*\(\$29\)/gi, "Feature - Quick Fix Report ($9) - Pro Fix Plan ($29)");

  return output;
}



function stableProReportValue(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}


function buildStableQuickFixReport(input: AuditInput) {
  const pageUrl = input.url || "Not provided";
  const product = input.product || "Not provided";
  const audience = input.audience || "Not provided";
  const goal =
    input.conversionGoal === "paid_users"
      ? "Get more paid users"
      : String(input.conversionGoal || "Not provided");

  return [
    "# Quick Fix Report",
    "",
    "## Overview",
    "The page communicates the core offer, but the paid upgrade path needs clearer value contrast. The $9 Quick Fix Report should feel like a specific next step after the free diagnosis, not a generic paid summary.",
    "",
    `Page reviewed: ${pageUrl}`,
    `Product or service: ${product}`,
    `Target audience: ${audience}`,
    `Primary conversion goal: ${goal}`,
    "",
    "## Conversion Score Breakdown",
    "| Area | Score | Evidence from page context | Specific fix |",
    "|---|---:|---|---|",
    "| Offer clarity | 7/10 | The offer is understandable, but visitors need a clearer reason to unlock the $9 report. | Show exactly what the Quick Fix Report includes before checkout. |",
    "| Paid value contrast | 5/10 | The free diagnosis can feel complete without a visible paid-report preview. | Add a compact comparison between the free diagnosis and the $9 Quick Fix Report. |",
    "| CTA clarity | 6/10 | The paid CTA should make the outcome and price explicit. | Use action-oriented CTA copy that includes the report name and $9 price. |",
    "| Trust reassurance | 5/10 | Payment reassurance should appear next to the checkout action. | Add secure PayPal checkout, one-time payment, and refund/support policy copy near the button. |",
    "| Delivery clarity | 6/10 | Visitors should know what happens after payment confirmation. | Explain that the user can generate, view, copy, or export the report after payment confirmation. |",
    "",
    "## Top 3 Quick Fixes",
    "",
    "### Fix 1: Make the $9 deliverable concrete",
    "- Problem: The page asks users to pay after a free diagnosis, but the paid output is not previewed clearly enough.",
    "- Recommended fix: Add a short preview block that shows the structure of the Quick Fix Report before checkout.",
    "- Implementation: Show three bullets: top blocker summary, top 3 fixes ranked by priority, and copy-ready wording changes.",
    "- Validation metric: Click-through rate from the report page to checkout.",
    "",
    "### Fix 2: Rewrite the Quick Fix CTA",
    "- Problem: A generic paid CTA creates friction because users do not know exactly what they are buying.",
    "- Recommended fix: Use CTA copy that names the report and price in one line.",
    "- Implementation: Replace the unlock CTA with \"Unlock My Quick Fix Report - $9\".",
    "- Validation metric: Checkout starts from users who view the CTA.",
    "",
    "### Fix 3: Add payment reassurance at the decision point",
    "- Problem: New visitors need process clarity before paying for a digital report.",
    "- Recommended fix: Add payment and delivery reassurance directly above or below the PayPal button.",
    "- Implementation: Use this copy: \"Secure PayPal checkout. One-time payment of $9. After payment confirmation, you can generate, view, copy, or export your Quick Fix Report.\"",
    "- Validation metric: Checkout completion rate among visitors who reach the payment page.",
    "",
    "## Page Copy Recommendations",
    "",
    "### Paid CTA",
    "Unlock My Quick Fix Report - $9",
    "",
    "### CTA support copy",
    "Get a concise paid report with your top conversion blockers, priority fixes, and copy-ready wording changes for the submitted page.",
    "",
    "### Payment reassurance copy",
    "Secure PayPal checkout. One-time payment of $9. No recurring charge. Refund and support policy available.",
    "",
    "### What happens after payment",
    "After payment confirmation, the user can generate, view, copy, or export the Quick Fix Report.",
    "",
    "## Free vs Quick Fix Comparison",
    "| Feature | Free Diagnosis | Quick Fix Report ($9) |",
    "|---|---|---|",
    "| Conversion blocker summary | Yes | Yes |",
    "| Prioritized fix list | Limited | Yes |",
    "| Copy-ready wording suggestions | No | Yes |",
    "| Checkout and CTA guidance | Limited | Yes |",
    "| Export or copy report | Yes | Yes |",
    "",
    "## Trust & Proof Guidance",
    "- Do not invent testimonials, customer names, revenue results, or performance numbers.",
    "- Use verified customer proof only after permission is obtained.",
    "- If verified proof is not available, use a clear explanation of what the report includes instead of a testimonial.",
    "- Keep payment reassurance factual: secure PayPal checkout, one-time payment, refund/support policy, and post-payment report access.",
    "",
    "## 7-Day Action Plan",
    "Day 1: Add the Free vs Quick Fix comparison table near the unlock CTA.",
    "Day 2: Replace the paid CTA with \"Unlock My Quick Fix Report - $9\".",
    "Day 3: Add the payment reassurance copy near the PayPal button.",
    "Day 4: Add a short preview of the Quick Fix Report structure before checkout.",
    "Day 5: Test the full flow from free diagnosis to checkout to report generation.",
    "Day 6: Review analytics for report-page clicks, checkout views, and payment completion.",
    "Day 7: Use analytics and support questions to decide the next copy iteration.",
    "",
    "## 14-Day Follow-up Checklist",
    "- Review click-through rate from report page to checkout.",
    "- Review checkout completion rate.",
    "- Compare Quick Fix Report and Pro Fix Plan selection.",
    "- Check whether users interact with the paid-report preview.",
    "- Review support questions about payment or report access.",
    "- Confirm refund/support policy links work.",
    "- Test the flow on mobile and desktop.",
    "- Verify that report generation, viewing, copying, and exporting work after payment confirmation.",
    "",
    "## Important Note",
    "These recommendations are strategy hypotheses based on the submitted page context. Validate changes with analytics, customer feedback, and A/B testing. No specific performance improvement is claimed."
  ].join("\n");
}

function buildStableProFixPlanReport(input: AuditInput) {
  const pageUrl = stableProReportValue(input.url, "the submitted page");
  const product = stableProReportValue(input.product, "the submitted product or service");
  const audience = stableProReportValue(input.audience, "the target audience");
  const goal = stableProReportValue(input.problem, "the paid conversion goal");

  return `# Pro Fix Plan

## Executive Diagnosis
The page communicates the core offer, but the paid upgrade path needs clearer value contrast. Visitors need to understand why the $29 Pro Fix Plan is meaningfully deeper than the $9 Quick Fix Report before they reach checkout.

The strongest opportunity is to show what the Pro Fix Plan adds: prioritized fixes, copy rewrites, CTA and checkout guidance, trust reassurance, objection handling, and implementation guidance.

Page reviewed: ${pageUrl}
Product or service: ${product}
Target audience: ${audience}
Primary conversion goal: ${goal}

## Conversion Score Breakdown

| Area | Score | Evidence from page context | Specific fix |
|---|---:|---|---|
| Offer clarity | 7/10 | The offer is understandable, but the difference between free diagnosis, $9 Quick Fix Report, and $29 Pro Fix Plan needs stronger contrast. | Add a compact comparison table near the upgrade CTA. |
| Paid plan perceived value | 5/10 | The page does not show enough of the deeper paid deliverable before checkout. | Add an anonymized sample section that previews the depth of the Pro Fix Plan. |
| CTA strength | 6/10 | The upgrade CTA can be more outcome-focused. | Use CTA copy that names the result: "Get Your Pro Fix Plan - $29". |
| Trust and payment reassurance | 5/10 | Payment reassurance and policy links should be visible at the decision point. | Add secure PayPal checkout, one-time payment, and published refund/support policy copy near the payment action. |
| Objection handling | 4/10 | Visitors may not understand why they should pay after receiving a free diagnosis. | Add a short FAQ below the upgrade CTA. |
| Checkout readiness | 6/10 | The checkout page should explain what happens after payment confirmation. | Use one clear line: "After payment confirmation, the user can generate, view, copy, or export the full fix plan." |

## Top 3 Paid Conversion Leaks

### Leak 1: The Pro value gap is not visible enough
- Why it hurts paid conversion: Visitors can understand the free diagnosis but may not see why the Pro Fix Plan is worth $29.
- What to change: Add a short comparison table showing what the $9 Quick Fix Report includes and what the $29 Pro Fix Plan adds.
- Priority: High
- Validation metric: Click-through rate from the result page to checkout.

### Leak 2: The upgrade CTA lacks a concrete preview
- Why it hurts paid conversion: Visitors are asked to pay before seeing the type of output they will receive.
- What to change: Add a small anonymized sample that shows one headline rewrite, one CTA improvement, and one implementation step.
- Priority: High
- Validation metric: Clicks on the sample preview and subsequent checkout starts.

### Leak 3: Payment reassurance is too far from the decision point
- Why it hurts paid conversion: New visitors need trust and process clarity before paying for a digital report.
- What to change: Place secure checkout, one-time payment, and published refund/support policy copy directly near the Pro CTA and checkout button.
- Priority: Medium
- Validation metric: Checkout completion rate among visitors who reach the payment page.

## Priority Fix Roadmap

### Fix 1: Add a paid-plan comparison table
- Page location: Free diagnosis result page, above the paid CTA area.
- Implementation effort: Low.
- Expected impact level: High.
- Exact copy or UI change:

| Feature | Quick Fix Report ($9) | Pro Fix Plan ($29) |
|---|---|---|
| Conversion blocker summary | Yes | Yes |
| Prioritized fix list | Limited | Full |
| Copy rewrites | Limited | Yes |
| CTA and checkout guidance | Limited | Yes |
| Objection handling | No | Yes |
| Implementation guidance | Limited | Yes |
| Copy or export report | Yes | Yes |

### Fix 2: Add a sample Pro preview
- Page location: Near the Pro Fix Plan CTA.
- Implementation effort: Low.
- Expected impact level: High.
- Exact copy or UI change:
"See an anonymized sample Pro Fix Plan section before checkout."

Sample preview format:
- Issue: The current CTA does not make the next step specific enough.
- Suggested rewrite: "Get Your Pro Fix Plan - $29"
- Reason: This clarifies the product, price, and outcome in one line.

### Fix 3: Add payment reassurance near checkout
- Page location: Checkout page, directly above or below the payment button.
- Implementation effort: Low.
- Expected impact level: Medium.
- Exact copy or UI change:
"Secure PayPal checkout. One-time payment. Link to the published refund/support policy."
"After payment confirmation, the user can generate, view, copy, or export the full fix plan."

## Hero & Above-the-Fold Rewrite

Recommended headline:
Fix the conversion blockers on your landing page

Recommended subheadline:
Start with a free diagnosis, then upgrade to a Pro Fix Plan for prioritized fixes, copy rewrites, CTA improvements, and implementation guidance.

Primary CTA:
Start Free Diagnosis

CTA microcopy:
No credit card required for the free diagnosis.

Alternate headline variants:
1. Find what is blocking paid conversions on your page
2. Turn your diagnosis into a prioritized fix plan

## CTA & Checkout Unlock Fixes

Primary unlock CTA:
Get Your Pro Fix Plan - $29

Secondary reassurance line:
Includes prioritized fixes, copy rewrites, CTA improvements, and implementation guidance for the submitted page.

Button text:
Get Your Pro Fix Plan

What the user sees after clicking:
A checkout page with the selected plan name, price, secure PayPal checkout, one-time payment wording, and a short list of what the Pro Fix Plan includes.

What happens after payment:
After payment confirmation, the user can generate, view, copy, or export the full fix plan.

## Trust & Payment Reassurance

Add these elements near the Pro CTA and payment button:
- Secure PayPal checkout.
- One-time payment of $29.
- Link to the published refund/support policy.
- Link to an anonymized sample Pro Fix Plan.
- Clear explanation: "After payment confirmation, the user can generate, view, copy, or export the full fix plan."

## Objection Handling FAQ

### 1. Why pay after the free diagnosis?
The free diagnosis identifies the main conversion blockers. The Pro Fix Plan turns that diagnosis into prioritized actions, copy rewrites, CTA improvements, and implementation guidance.

### 2. How is Pro different from the Quick Fix Report?
The $9 Quick Fix Report gives a concise paid summary. The $29 Pro Fix Plan is deeper and includes more complete guidance for copy, CTA, checkout, trust, and implementation.

### 3. Is this specific to my page?
Yes. The Pro Fix Plan is based on the submitted page URL and the free diagnosis result.

### 4. What if I am not technical?
The plan is written in plain language. Copy suggestions can be copied into a page builder, and implementation steps can be shared with a developer or designer.

### 5. What happens after payment?
After payment confirmation, the user can generate, view, copy, or export the full fix plan. For payment or support questions, refer to the published refund/support policy.

## A/B Testing Plan

### Test 1: Pro CTA copy
- Hypothesis: A clearer outcome-focused CTA will increase checkout starts.
- Control: Existing Pro CTA.
- Variant: "Get Your Pro Fix Plan - $29"
- Metric: Click-through rate from result page to checkout.
- Minimum data note: Use directional data until traffic volume is large enough for a formal test.

### Test 2: Sample preview
- Hypothesis: Showing an anonymized sample section will increase paid-plan selection.
- Control: No sample preview.
- Variant: Add a sample preview link near the Pro CTA.
- Metric: Checkout starts among visitors who view the sample.
- Minimum data note: Compare against the prior baseline.

### Test 3: Payment reassurance
- Hypothesis: Trust and process clarity near checkout will reduce abandonment.
- Control: Current checkout page.
- Variant: Secure checkout, one-time payment, published policy link, and what-happens-after-payment copy.
- Metric: Checkout completion rate.
- Minimum data note: Review results after enough checkout visits for a directional comparison.

## 7-Day Implementation Plan

Day 1: Add the comparison table to the free diagnosis result page.
Day 2: Rewrite the Pro CTA and supporting microcopy.
Day 3: Add the sample Pro preview link.
Day 4: Add trust and payment reassurance near the checkout button.
Day 5: Add the objection-handling FAQ.
Day 6: QA the full flow from diagnosis to checkout to report generation.
Day 7: Review analytics events for result-page clicks, checkout views, payment starts, and paid-plan generation.

## 14-Day Follow-up Checklist

- Review click-through rate from result page to checkout.
- Review checkout completion rate.
- Compare $9 Quick Fix Report and $29 Pro Fix Plan selection.
- Check whether users click the sample preview.
- Review support questions about payment or delivery.
- Confirm the published refund/support policy link works.
- Test the flow on mobile and desktop.
- Verify that report generation, viewing, copying, and exporting work after payment confirmation.
- Use analytics and user feedback to decide the next iteration.

## Important Note
All recommendations in this Pro Fix Plan are hypotheses based on the submitted page context. Validate changes with analytics, customer feedback, and A/B testing. No specific performance improvement is claimed.`;
}


function finalizePaidReportBeforeQualityGate(report: string) {
  let output = normalizePaidReportPriceArtifacts(report);

  // Keep this finalizer intentionally small.
  // It should normalize export artifacts and deterministic product naming mistakes only.
  // It must not broadly rewrite business claims such as "immediately", "real", or "refund",
  // because broad rewrites created malformed phrases in previous iterations.
  output = output.replace(/\r\n/g, "\n");
  output = output.replace(/[\u2010-\u2015\u2212\u00AD\uFE58\uFE63\uFF0D]/g, "-");
  output = output.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  // Deterministic product and price corrections.
  output = output.replace(/Quick Fix Report\s*\(\s*\$29\s*\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/Quick Fix\s*\(\s*\$29\s*\)/gi, "Quick Fix ($9)");
  output = output.replace(/\$29\s+Quick Fix Report\b/gi, "$9 Quick Fix Report");
  output = output.replace(/\$29\s+Quick Fix\b/gi, "$9 Quick Fix");
  output = output.replace(/Quick Fix Report\s*[-=:]\s*\$29\b/gi, "Quick Fix Report - $9");
  output = output.replace(/Pro Fix Plan\s*\(\s*\$9\s*\)/gi, "Pro Fix Plan ($29)");
  output = output.replace(/\$9\s+Pro Fix Plan\b/gi, "$29 Pro Fix Plan");
  output = output.replace(/\$9\s+Pro Fix\b/gi, "$29 Pro Fix");
  output = output.replace(/\$29\s+version\b/gi, "$9 Quick Fix Report");
  output = output.replace(/\$29\s+tier\b/gi, "$9 Quick Fix Report");
  output = output.replace(/\$29\s+vs\.?\s+\$29\b/gi, "$9 vs. $29");
  output = output.replace(/clicks on\s+\$29\s+vs\.?\s+\$29\s+options/gi, "clicks on $9 Quick Fix and $29 Pro options");
  output = output.replace(/split between clicks on\s+\$29\s+vs\.?\s+\$29\s+options/gi, "split between clicks on $9 Quick Fix and $29 Pro options");
  output = output.replace(/ratio of\s+\$29\s+vs\.?\s+\$29\s+purchases/gi, "ratio of $9 Quick Fix purchases vs. $29 Pro purchases");
  output = output.replace(/\$29\s+and\s+\$29/gi, "$9 and $29");
  output = output.replace(/\$29\s+or\s+\$29/gi, "$9 or $29");
  output = output.replace(/total\s+\$29\b/gi, "one-time price of $29");

  // Deterministic uncertainty-word cleanup.
  // This is intentionally narrow: it only converts prohibited uncertainty style words
  // into neutral modal wording. It does not rewrite delivery, refund, proof, or trust claims.
  output = output.replace(/is likely to\s+/gi, "may ");
  output = output.replace(/are likely to\s+/gi, "may ");
  output = output.replace(/was likely to\s+/gi, "may ");
  output = output.replace(/were likely to\s+/gi, "may ");
  output = output.replace(/will likely\s+/gi, "may ");
  output = output.replace(/would likely\s+/gi, "would ");
  output = output.replace(/could likely\s+/gi, "could ");
  output = output.replace(/should likely\s+/gi, "should ");
  output = output.replace(/more likely to\s+/gi, "more able to ");
  output = output.replace(/most likely\s+/gi, "");
  output = output.replace(/likely generic/gi, "may be generic");
  output = output.replace(/likely uses/gi, "may use");
  output = output.replace(/likely satisfies/gi, "may satisfy");
  output = output.replace(/likely has/gi, "may have");
  output = output.replace(/likely lacks/gi, "may lack");
  output = output.replace(/likely appears/gi, "may appear");
  output = output.replace(/likely feels/gi, "may feel");
  output = output.replace(/likely seems/gi, "may seem");
  output = output.replace(/a likely ([a-z]+)/gi, "a possible $1");
  output = output.replace(/the likely ([a-z]+)/gi, "the possible $1");
  output = output.replace(/likely/gi, "may");
  output = output.replace(/assumed/gi, "provided");
  output = output.replace(/assuming/gi, "using");
  output = output.replace(/hypothesized/gi, "proposed");
  output = output.replace(/estimated/gi, "directional");
  output = output.replace(/current from context/gi, "submitted page context");
  output = output.replace(/current hero likely/gi, "submitted hero section");
  output = output.replace(/assuming page structure/gi, "using the submitted page context");

  // Deterministic export and grammar artifacts.
  output = output.replace(/business-s/gi, "business's");
  output = output.replace(/visitor-s/gi, "visitor's");
  output = output.replace(/user-s/gi, "user's");
  output = output.replace(/page-s/gi, "page's");
  output = output.replace(/plan-s/gi, "plan's");
  output = output.replace(/PayPal-s/gi, "PayPal's");
  output = output.replace(/Aren-t/gi, "aren't");
  output = output.replace(/doesn-t/gi, "doesn't");
  output = output.replace(/don-t/gi, "don't");
  output = output.replace(/isn-t/gi, "isn't");
  output = output.replace(/Here-s/gi, "Here's");
  output = output.replace(/What-s/gi, "What's");
  output = output.replace(/Can-t/gi, "Can't");
  output = output.replace(/page'specific/gi, "page-specific");
  output = output.replace(/object handing/gi, "objection handling");
  output = output.replace(/a verified result issues/gi, "conversion issues");
  output = output.replace(/verified result issues/gi, "conversion issues");
  output = output.replace(/Your top blocker:\s*\./gi, "Your top blocker is shown in the free diagnosis result.");
  output = output.replace(/may generic/gi, "may be generic");
  output = output.replace(/may uses/gi, "may use");
  output = output.replace(/may satisfies/gi, "may satisfy");
  output = output.replace(/may works/gi, "may work");
  output = output.replace(/may has/gi, "may have");
  output = output.replace(/may a summary/gi, "may show a summary");
  output = output.replace(/\bis may\s+generic\b/gi, "may be generic");
  output = output.replace(/\bis may\s+satisf(?:y|ies)\b/gi, "may satisfy");
  output = output.replace(/\bis may\s+use(?:s)?\b/gi, "may use");
  output = output.replace(/\bis may\s+work(?:s)?\b/gi, "may work");
  output = output.replace(/\bis may\s+lack(?:s)?\b/gi, "may lack");
  output = output.replace(/\bis may\s+appear(?:s)?\b/gi, "may appear");
  output = output.replace(/\bis may\s+feel\b/gi, "may feel");
  output = output.replace(/\bis may\s+seem\b/gi, "may seem");
  output = output.replace(/\bis may\b/gi, "may be");

  output = output.replace(/[ \t]{2,}/g, " ");
  output = output.replace(/\n{3,}/g, "\n\n");

  // Absolute last pass for prohibited uncertainty wording.
  // Keep this immediately before return so no earlier cleanup can reintroduce these terms.
  output = output.replace(/will likely/gi, "may");
  output = output.replace(/would likely/gi, "would");
  output = output.replace(/could likely/gi, "could");
  output = output.replace(/should likely/gi, "should");
  output = output.replace(/is likely to/gi, "may");
  output = output.replace(/are likely to/gi, "may");
  output = output.replace(/was likely to/gi, "may");
  output = output.replace(/were likely to/gi, "may");
  output = output.replace(/more likely to/gi, "more able to");
  output = output.replace(/most likely/gi, "most");
  output = output.replace(/a likely/gi, "a possible");
  output = output.replace(/the likely/gi, "the possible");
  output = output.replace(/likely/gi, "may");
  output = output.replace(/assumed/gi, "provided");
  output = output.replace(/assuming/gi, "using");
  output = output.replace(/hypothesized/gi, "proposed");
  output = output.replace(/estimated/gi, "directional");
  output = output.replace(/current from context/gi, "submitted page context");
  output = output.replace(/current hero likely/gi, "submitted hero section");
  output = output.replace(/assuming page structure/gi, "using the submitted page context");

  return output.trim();
}


function forcePaidReportLastPass(report: string) {
  let output = report;

  const replacements: Array<[RegExp, string]> = [
    // Pricing artifacts.
    [/Quick Fix Report\s*\(\s*\$29\s*\)/gi, "Quick Fix Report ($9)"],
    [/Quick Fix\s*\(\s*\$29\s*\)/gi, "Quick Fix ($9)"],
    [/\$29\s+Quick Fix Report\b/gi, "$9 Quick Fix Report"],
    [/\$29\s+Quick Fix\b/gi, "$9 Quick Fix"],
    [/Pro Fix Plan\s*\(\s*\$9\s*\)/gi, "Pro Fix Plan ($29)"],
    [/\$9\s+Pro Fix Plan\b/gi, "$29 Pro Fix Plan"],
    [/\$9\s+Pro Fix\b/gi, "$29 Pro Fix"],
    [/\$29\s+version\b/gi, "$9 Quick Fix Report"],
    [/\$29\s+tier\b/gi, "$9 Quick Fix Report"],
    [/\$29\s+vs\.?\s+\$29\b/gi, "$9 vs. $29"],
    [/\$29\s+and\s+\$29/gi, "$9 and $29"],
    [/\$29\s+or\s+\$29/gi, "$9 or $29"],
    [/Starting at \$29 or \$29/gi, "Starting at $9 or $29"],
    [/total\s+\$29\b/gi, "one-time price of $29"],

    // Uncertainty style.
    [/is likely to\s+/gi, "may "],
    [/are likely to\s+/gi, "may "],
    [/was likely to\s+/gi, "may "],
    [/were likely to\s+/gi, "may "],
    [/will likely\s+/gi, "may "],
    [/would likely\s+/gi, "would "],
    [/could likely\s+/gi, "could "],
    [/should likely\s+/gi, "should "],
    [/more likely to\s+/gi, "more able to "],
    [/most likely/gi, "most"],
    [/a likely/gi, "a possible"],
    [/the likely/gi, "the possible"],
    [/(^|[^A-Za-z])likely([^A-Za-z]|$)/gi, "$1may$2"],
    [/(^|[^A-Za-z])assumed([^A-Za-z]|$)/gi, "$1provided$2"],
    [/(^|[^A-Za-z])assuming([^A-Za-z]|$)/gi, "$1using$2"],
    [/(^|[^A-Za-z])hypothesized([^A-Za-z]|$)/gi, "$1proposed$2"],
    [/(^|[^A-Za-z])estimated([^A-Za-z]|$)/gi, "$1directional$2"],
    [/current from context/gi, "submitted page context"],
    [/current hero likely/gi, "submitted hero section"],
    [/assuming page structure/gi, "using the submitted page context"],

    // Delivery/timing claims.
    [/not immediately obvious/gi, "not obvious"],
    [/immediately obvious/gi, "obvious"],
    [/Immediate access/gi, "Access after payment confirmation"],
    [/Immediate download/gi, "Export after generation"],
    [/download starts immediately/gi, "export is available after generation"],
    [/immediate PDF download/gi, "PDF export after generation"],
    [/instantly downloadable/gi, "exportable after generation"],
    [/immediately downloadable/gi, "exportable after generation"],
    [/instantly generated/gi, "generated after payment confirmation"],
    [/generated immediately/gi, "generated after payment confirmation"],
    [/immediately generate/gi, "generate after payment confirmation"],
    [/generate immediately/gi, "generate after payment confirmation"],
    [/immediately view/gi, "view after generation"],
    [/view immediately/gi, "view after generation"],
    [/immediately copy/gi, "copy after generation"],
    [/copy immediately/gi, "copy after generation"],
    [/immediately export/gi, "export after generation"],
    [/export immediately/gi, "export after generation"],
    [/available immediately/gi, "available after generation"],
    [/accessible immediately/gi, "available after generation"],
    [/ready to view/gi, "available to view after generation"],
    [/receive a link to generate/gi, "can generate"],
    [/No additional steps are required/gi, "Use the generated report to apply fixes"],
    [/No waiting/gi, "After payment confirmation"],
    [/without delay/gi, "after payment confirmation"],
    [/in\s+\d+\s+minutes?/gi, "after payment confirmation"],
    [/within\s+\d+\s+(seconds?|minutes?|hours?|days?)/gi, "after payment confirmation"],
    [/takes\s+\d+\s+minutes?/gi, "starts from the free diagnosis"],
    [/delivered within/gi, "available after"],
    [/email delivery within/gi, "report generation after"],
    [/\bimmediately\b/gi, "after payment confirmation"],
    [/\binstant(?:ly)?\b/gi, "after payment confirmation"],
    [/not after payment confirmation obvious/gi, "not obvious"],
    [/after payment confirmation obvious/gi, "obvious"],
    [/after payment confirmation\s+(above|below|next to|near|under)\b/gi, "directly $1"],
    [/after payment confirmation\s+see\b/gi, "see"],
    [/can after payment confirmation\s+/gi, "can "],
    [/after payment confirmation confirmation/gi, "after payment confirmation"],
    [/after payment confirmation after payment confirmation/gi, "after payment confirmation"],
    [/after payment confirmation after payment/gi, "after payment confirmation"],
    [/after generation after payment/gi, "after payment confirmation"],

    // Refund/support overclaims.
    [/30[-\s]?day satisfaction refund policy/gi, "published refund/support policy"],
    [/30[-\s]?day refund policy/gi, "published refund/support policy"],
    [/30[-\s]?day/gi, "published"],
    [/14[-\s]?day support/gi, "published support"],
    [/full refund/gi, "published refund/support policy"],
    [/satisfaction refund/gi, "published refund/support"],
    [/satisfaction guarantee/gi, "published policy"],
    [/no questions asked/gi, "refer to the published policy"],
    [/refund policy here/gi, "published refund/support policy"],
    [/support policy here/gi, "published support policy"],
    [/Full support policy/gi, "Published support policy"],
    [/only if such a policy exists/gi, "use the published policy"],
    [/\bguarantees?\b/gi, "explains"],
    [/\bguaranteed\b/gi, "explained"],

    // Unsupported proof/trust/sample-source wording.
    [/real customer/gi, "customer"],
    [/verified customer/gi, "customer"],
    [/customer proof/gi, "trust evidence"],
    [/Trusted by/gi, "Built for"],
    [/used by/gi, "for"],
    [/Join 500\+/gi, "Use"],
    [/PayPal Verified/gi, "secure PayPal checkout"],
    [/protected by PayPal/gi, "processed by PayPal"],
    [/PayPal's standard security info/gi, "PayPal checkout information"],
    [/SSL encrypted/gi, "secure checkout"],
    [/\bproven\b/gi, "practical"],
    [/battle-tested/gi, "practical"],
    [/tested fixes/gi, "fix ideas"],
    [/conversion science/gi, "conversion principles"],
    [/validated hypotheses/gi, "proposed tests"],

    [/real but anonymi[sz]ed/gi, "anonymized sample"],
    [/real,\s*sanitized/gi, "sample"],
    [/real sample/gi, "sample"],
    [/real example/gi, "sample example"],
    [/real content/gi, "sample content"],
    [/real fix/gi, "sample fix"],
    [/previous Pro Fix Plan/gi, "sample Pro Fix Plan"],
    [/past customer/gi, "sample page"],
    [/similar client page/gi, "sample page"],
    [/actual recommendation/gi, "sample recommendation"],

    // Unsupported exact scope/counts.
    [/\b(?:5|6|10|12|15|20|30|40)\+\b/g, "multiple"],
    [/12-15/g, "several"],
    [/8-12/g, "several"],
    [/3-5\s+(general recommendations|prioritized fix recommendations|fixes|top-level fixes)/gi, "several $1"],
    [/1-2\s+general conversion blockers/gi, "one or more conversion blockers"],
    [/20\+ pages/gi, "detailed report"],
    [/40\+ conversion/gi, "multiple conversion"],
    [/visual heatmap/gi, "issue map"],
    [/heatmap of issues/gi, "issue map"],

    // Unsupported account/workflow claims.
    [/account page/gi, "report page"],
    [/stored in (your|their) account/gi, "available in the generated report"],
    [/in your account/gi, "in the generated report"],
    [/revisited at any time/gi, "copied or exported"],
    [/pre-filled email/gi, "contact email"],
    [/sign up/gi, "continue"],
    [/re-enter details/gi, "resubmit details"],

    // Launch/community/promotion/scarcity wording.
    [/\bProduct Hunt\b/gi, "launch page"],
    [/\bReddit\b/gi, "community"],
    [/\br\/SaaS\b|\br\/shopify\b|\br\/Entrepreneur\b/gi, "community"],
    [/Maker'?s? comment/gi, "short comment"],
    [/launch follow-up/gi, "follow-up"],
    [/re-engagement email/gi, "follow-up message"],
    [/fake Reddit comments/gi, "sample comments"],
    [/alt account/gi, "sample account"],
    [/from user\/alt/gi, "from sample user"],
    [/first\s+(5|50|100)/gi, "early users"],
    [/after 100 plans/gi, "later"],
    [/Only 20 plans left/gi, ""],
    [/limited availability|limited spots|countdown|expires soon|expires in 24 hours|free diagnosis expires|price increases|coupon|discount code|PRO19|within 7 days|within 1 hour/gi, ""],

    // Grammar/export artifacts.
    [/business-s/gi, "business's"],
    [/visitor-s/gi, "visitor's"],
    [/user-s/gi, "user's"],
    [/page-s/gi, "page's"],
    [/plan-s/gi, "plan's"],
    [/PayPal-s/gi, "PayPal's"],
    [/Aren-t/gi, "aren't"],
    [/doesn-t/gi, "doesn't"],
    [/don-t/gi, "don't"],
    [/isn-t/gi, "isn't"],
    [/Here-s/gi, "Here's"],
    [/What-s/gi, "What's"],
    [/Can-t/gi, "Can't"],
    [/page'specific/gi, "page-specific"],
    [/object handing/gi, "objection handling"],
    [/a verified result issues/gi, "conversion issues"],
    [/verified result issues/gi, "conversion issues"],
    [/Your top blocker:\s*\./gi, "Your top blocker is shown in the free diagnosis result."],
    [/may generic/gi, "may be generic"],
    [/may uses/gi, "may use"],
    [/may satisfies/gi, "may satisfy"],
    [/may works/gi, "may work"],
    [/may has/gi, "may have"],
    [/may a summary/gi, "may show a summary"],
    [/\bis may\s+generic\b/gi, "may be generic"],
    [/\bis may\s+satisf(?:y|ies)\b/gi, "may satisfy"],
    [/\bis may\s+use(?:s)?\b/gi, "may use"],
    [/\bis may\s+work(?:s)?\b/gi, "may work"],
    [/\bis may\s+lack(?:s)?\b/gi, "may lack"],
    [/\bis may\s+appear(?:s)?\b/gi, "may appear"],
    [/\bis may\s+feel\b/gi, "may feel"],
    [/\bis may\s+seem\b/gi, "may seem"],
    [/\bis may\b/gi, "may be"],
    // Final wording repairs found in post-reset PDF QA.
    [/No additional steps are required/gi, "Use the generated report to apply fixes"],
    [/No additional steps\b/gi, "Use the generated report to apply fixes"],
    [/There is After payment confirmation or additional steps\./gi, "After payment confirmation, you can generate, view, copy, or export the full fix plan."],
    [/No improvement is explained/gi, "No specific improvement is claimed"],
    [/No improvement is claimed/gi, "No specific improvement is claimed"],
    [/No guaranteed improvement is claimed/gi, "No specific improvement is claimed"],
    [/guaranteed improvement/gi, "specific improvement"],
    [/The Current page risk/gi, "The current page risk"],
    [/The \$29 Pro Fix Plan/gi, "the $29 Pro Fix Plan"],
    [/•\s*&\s*/g, "• "],
    [/^\s*&\s+/gm, ""],

    // Latest PDF QA residue repairs: pricing, assumptions, sample-source wording, and awkward final note.
    [/Quick Fix Report\):\s*\$29/gi, "Quick Fix Report): $9"],
    [/Quick Fix Report:\s*\$29/gi, "Quick Fix Report: $9"],
    [/Option 1 \(Quick Fix Report\):\s*\$29/gi, "Option 1 (Quick Fix Report): $9"],
    [/percentage of \$29 purchases increasing/gi, "percentage of $29 Pro Fix Plan purchases increasing"],
    [/\$29 plan over the \$29 plan/gi, "$29 Pro Fix Plan over the $9 Quick Fix Report"],
    [/15\+\s+page-specific fixes/gi, "deeper page-specific fixes"],
    [/3 generic recommendations/gi, "several concise recommendations"],
    [/2-3 sample fixes/gi, "sample fixes"],
    [/ready in one click/gi, "available after generation"],
    [/one actual fix/gi, "one sample fix"],
    [/similar page/gi, "sample page"],
    [/See a sample of the Pro Fix Plan for a similar page/gi, "See an anonymized sample of the Pro Fix Plan"],
    [/It assumes the current hero is generic\. Adjust based on actual page content\./gi, "Use the submitted page context when applying this rewrite."],
    [/it assumes the current hero is generic/gi, "use the submitted page context"],
    [/email sequence for free diagnosis users who did not purchase/gi, "follow-up improvements for free diagnosis users who did not purchase"],
    [/email sequence/gi, "follow-up message"],
    [/No improvement in conversion rates is explained/gi, "No specific improvement in conversion rates is claimed"],
    [/No improvement in ([^.]+?) is explained/gi, "No specific improvement in $1 is claimed"],

  ];

  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }

  output = output.replace(/[ \t]{2,}/g, " ");
  output = output.replace(/\n{3,}/g, "\n\n");

  return output.trim();
}



function assertPaidReportQuality(report: string) {
  const blockedPatterns: Array<{ pattern: RegExp; label: string }> = [
    // Placeholders / template leakage
    { pattern: /\[[^\]]+\]|\[your actual price\]|\[price\]|\[customer name\]|\[company\]/i, label: "placeholder leakage" },
    { pattern: /\blikely\b|\bassumed\b|\bhypothesized\b|\bestimated\b|current from context|current hero likely|assuming page structure/i, label: "template uncertainty leakage" },

    // Pricing logic
    { pattern: /pay \$29 for the Pro Fix Plan instead of \$29 for the Quick Fix Report|instead of \$29 for the Quick Fix Report|Quick Fix Report costs \$29|Quick Fix Report is \$29|the \$29 Quick Fix Report/i, label: "latest quick fix price residue" },
    { pattern: /they Use the free version is sufficient|Ø=Ý|Medium\ufffeValidation|table\ufffeVariant|We-ll|in 60 seconds|No account or email delivery needed|No account needed|email delivery|done-for-you solution|delivered as a scrollable page/i, label: "latest generated PDF wording residue" },
    { pattern: /pay \$29 for the Pro Fix Plan instead of \$29 for the Quick Fix Report|\$29 for the Quick Fix Report|extra \$29 buys|Quick Fix Report\):\s*\$29|Quick Fix Report:\s*\$29/i, label: "final latest pricing residue" },
    { pattern: /3Get Your Pro Fix Plan 3|3Get Quick Fix Report 3|report-s|Ø=Ý|No additional steps|There is After payment confirmation|Secured by PayPal|2-3 pages of example fixes|2-3 paying customers|No improvement in .* is explained/i, label: "final latest PDF residue" },
    { pattern: /Quick Fix Report\):\s*\$29|Quick Fix Report:\s*\$29|Option 1 \(Quick Fix Report\):\s*\$29|\$29 plan over the \$29 plan|percentage of \$29 purchases increasing/i, label: "latest pricing residue" },
    { pattern: /15\+\s+page-specific fixes|3 generic recommendations|2-3 sample fixes/i, label: "latest unsupported count residue" },
    { pattern: /ready in one click|one actual fix|similar page|See a sample of the Pro Fix Plan for a similar page/i, label: "latest sample/timing residue" },
    { pattern: /assumes the current hero is generic|email sequence|No improvement in .* is explained/i, label: "latest wording residue" },
    { pattern: /Quick Fix Report\s*\(\s*\$29\s*\)|Quick Fix\s*\(\s*\$29\s*\)|\$29\s+Quick Fix(?: Report)?\b|Quick Fix(?: Report)?\s*[-=:]\s*\$29\b/i, label: "incorrect quick fix price" },
    { pattern: /Pro Fix Plan\s*\(\s*\$9\s*\)|\$9\s+Pro Fix(?: Plan)?\b/i, label: "incorrect pro price" },
    { pattern: /\$29\s+version|\$29\s+tier|\$29\s+vs\.?\s+\$29|\$29\s+and\s+\$29|\$29\s+or\s+\$29|Starting at \$29 or \$29|total\s+\$29/i, label: "incorrect pricing logic" },

    // Delivery/timing claims. Use the exact canonical delivery sentence instead.
    { pattern: /\bimmediately\b|\binstant(?:ly)?\b|Immediate access|Immediate download|download starts immediately|immediate PDF download|instantly downloadable|immediately downloadable/i, label: "unsupported instant delivery wording" },
    { pattern: /in\s+\d+\s+minutes?|within\s+\d+\s+(seconds?|minutes?|hours?|days?)|takes\s+\d+\s+minutes?|delivered within|email delivery within|No additional steps required|No waiting|without delay|available right away|accessible immediately|ready to view|receive a link to generate|No additional steps|There is After payment confirmation or additional steps|after payment confirmation confirmation|after payment confirmation after payment|after generation after payment/i, label: "unsupported delivery timing claim" },

    // Refund/guarantee/support overclaims. Published policy links are allowed; promises are not.
    { pattern: /30[-\s]?day|14[-\s]?day support|full refund|satisfaction refund|satisfaction guarantee|guarantee|guaranteed improvement|No improvement is explained|no questions asked|refund policy here|support policy here|Full support policy|only if such a policy exists/i, label: "unsupported refund/support wording" },

    // Fake proof / unsupported trust / real-customer sample claims
    { pattern: /real customer|verified customer|customer proof|used by|Trusted by|Join 500\+|PayPal Verified|protected by PayPal|PayPal's standard security info|SSL encrypted|proven|battle-tested|tested fixes|conversion science|validated hypotheses/i, label: "unsupported proof/trust wording" },
    { pattern: /real but anonymi[sz]ed|real, sanitized|real sample|real example|real content|real fix|previous Pro Fix Plan|past customer|similar client|similar client page|actual recommendation/i, label: "unsupported sample-source wording" },

    // Unsupported exact scope / counts
    { pattern: /\b(?:5|6|10|12|15|20|30|40)\+\b|12-15|8-12|3-5\s+(?:general recommendations|prioritized fix recommendations|fixes|top-level fixes)|1-2\s+general conversion blockers|20\+ pages|40\+ conversion|visual heatmap|heatmap of issues/i, label: "unsupported scope/count claim" },

    // Unsupported account/workflow claims
    { pattern: /account page|stored in (?:your|their) account|in your account|revisited at any time|pre-filled email|sign up|re-enter details/i, label: "unsupported account/workflow claim" },

    // Launch/community/promotion content
    { pattern: /\bProduct Hunt\b|\bReddit\b|\br\/SaaS\b|\br\/shopify\b|\br\/Entrepreneur\b|Maker'?s? comment|launch follow-up|re-engagement email|fake Reddit comments|alt account|from user\/alt/i, label: "launch/community content not allowed" },

    // Scarcity / discount / urgency not supported
    { pattern: /first\s+(?:5|50|100)|after 100 plans|Only 20 plans left|limited availability|limited spots|countdown|expires soon|expires in 24 hours|free diagnosis expires|price increases|coupon|discount code|PRO19|within 7 days|within 1 hour/i, label: "unsupported scarcity/discount claim" },

    // Grammar/export artifacts
    { pattern: /is may|may generic|a verified result|page'specific|object handing|business-s\b|visitor-s\b|user-s\b|page-s\b|plan-s\b|PayPal-s\b|Aren-t\b|doesn-t\b|don-t\b|isn-t\b|Here-s\b|What-s\b|Can-t\b/i, label: "grammar/export artifact" },
  ];

  const matched = blockedPatterns.find(({ pattern }) => pattern.test(report));

  if (matched) {
    const match = report.match(matched.pattern);
    console.error("PAID_REPORT_QUALITY_BLOCKED", matched.label, match?.[0]);
    throw new Error(
      process.env.NODE_ENV === "development"
        ? `The paid report did not pass quality checks: ${matched.label}. Please generate it again.`
        : "The paid report did not pass quality checks. Please generate it again."
    );
  }
}

async function sendLeadWebhook(input: AuditInput, report: string) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, report, createdAt: new Date().toISOString() })
    });
  } catch (error) {
    console.error("LEAD_WEBHOOK_ERROR", error);
  }
}

function parseModelReport(rawText: string, input: AuditInput) {
  try {
    const reportV2 = parseAuditReportV2(rawText);
    if (isValidAuditReportV2(reportV2)) {
      const sanitizedReportV2 = sanitizeAuditReportV2(reportV2, input);
      const deliveryReportV2 = finalizeAuditReportForDelivery(sanitizedReportV2, input);
      return {
        report: formatReportV2AsText(deliveryReportV2),
        reportV2: deliveryReportV2
      };
    }
  } catch (error) {
    console.error("REPORT_V2_PARSE_ERROR", error);
  }

  const looksLikeJson = rawText.trim().startsWith("{") || rawText.trim().startsWith("```json");

  return {
    report: looksLikeJson
      ? "Structured report generation did not complete correctly. Please generate the report again."
      : rawText,
    reportV2: null
  };
}



const DIAGNOSIS_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
const DAILY_RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60;

type DiagnosisCachePayload = {
  report: string;
  reportV2: AuditReportV2 | null;
  demo?: boolean;
  diagnosisId: string;
  cacheExpiresAt: string;
  generatedAt: string;
};

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeDiagnosisText(value?: string) {
  return (value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeDiagnosisUrl(value?: string) {
  const raw = (value || "").trim();

  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return normalizeDiagnosisText(raw);
  }
}

function buildDiagnosisFingerprint(input: AuditInput) {
  const canonical = {
    url: normalizeDiagnosisUrl(input.url),
    product: normalizeDiagnosisText(input.product),
    audience: normalizeDiagnosisText(input.audience),
    problem: normalizeDiagnosisText(input.problem),
    conversionGoal: normalizeDiagnosisText(input.conversionGoal),
    pageCopy: normalizeDiagnosisText(input.pageCopy)
  };

  return hashText(JSON.stringify(canonical));
}

function buildDiagnosisId(fingerprint: string) {
  return `dx_${fingerprint.slice(0, 12)}`;
}

function buildDiagnosisCacheKey(fingerprint: string) {
  return `acc2:diagnosis:v1:${fingerprint}`;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || "unknown";
}

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10);
}

function safeLimitKeyPart(value: string) {
  return hashText(value || "unknown").slice(0, 16);
}

async function getCachedDiagnosis(cacheKey: string) {
  const redis = getRedisClient();
  if (!redis) return null;

  return redis.get<DiagnosisCachePayload>(cacheKey);
}

async function saveCachedDiagnosis(cacheKey: string, payload: DiagnosisCachePayload) {
  const redis = getRedisClient();
  if (!redis) return;

  await redis.set(cacheKey, payload, { ex: DIAGNOSIS_CACHE_TTL_SECONDS });
}

async function incrementDailyCounter(key: string) {
  const redis = getRedisClient();
  if (!redis) return 0;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, DAILY_RATE_LIMIT_TTL_SECONDS);
  }

  return count;
}

async function enforceDiagnosisRateLimits(input: AuditInput, request: Request) {
  const redis = getRedisClient();
  if (!redis) return;

  const day = todayKeyPart();

  const visitorKey = `acc2:rl:visitor:${day}:${safeLimitKeyPart(input.visitorId || "anonymous")}`;
  const ipKey = `acc2:rl:ip:${day}:${safeLimitKeyPart(getClientIp(request))}`;
  const urlKey = `acc2:rl:url:${day}:${safeLimitKeyPart(normalizeDiagnosisUrl(input.url))}`;

  const visitorCount = await incrementDailyCounter(visitorKey);
  if (visitorCount > 3) {
    throw new Error("You have reached today’s free diagnosis limit. Please try again tomorrow, view the sample report, or unlock the full fix plan from an existing diagnosis.");
  }

  const ipCount = await incrementDailyCounter(ipKey);
  if (ipCount > 20) {
    throw new Error("Too many free diagnoses have been requested from this network today. Please try again later.");
  }

  const urlCount = await incrementDailyCounter(urlKey);
  if (urlCount > 5) {
    throw new Error("This page has reached the daily limit for new diagnosis variations. Please reuse an existing diagnosis or try again tomorrow.");
  }
}

async function runDiagnosisWithCache(input: AuditInput, request: Request) {
  const fingerprint = buildDiagnosisFingerprint(input);
  const diagnosisId = buildDiagnosisId(fingerprint);
  const cacheKey = buildDiagnosisCacheKey(fingerprint);

  const cached = await getCachedDiagnosis(cacheKey);

  if (cached) {
    return {
      ...cached,
      cached: true
    };
  }

  await enforceDiagnosisRateLimits(input, request);

  const result = await generateWithAI({
    ...input,
    generationMode: "diagnosis",
    tier: "basic"
  });

  const cacheExpiresAt = new Date(Date.now() + DIAGNOSIS_CACHE_TTL_SECONDS * 1000).toISOString();

  const payload: DiagnosisCachePayload = {
    report: result.report,
    reportV2: result.reportV2 || null,
    demo: result.demo,
    diagnosisId,
    cacheExpiresAt,
    generatedAt: new Date().toISOString()
  };

  await saveCachedDiagnosis(cacheKey, payload);

  return {
    ...payload,
    cached: false
  };
}

function sanitizeSolutionMarkdown(text: string, input?: AuditInput) {
  let output = text;

  // Replace deprecated or unavailable tool recommendations before the quality gate runs.
  output = output.replace(/Google Optimize/gi, "GA4 Funnel Exploration, Microsoft Clarity, VWO, or Optimizely");
  output = output.replace(/VWO, or Optimizely or VWO/gi, "VWO or Optimizely");

  // Remove availability placeholders from generated paid reports.
  output = output.replace(/verified user feedback if available/gi, "real customer feedback only when you have written permission");
  output = output.replace(/verified customer proof if available/gi, "customer proof only if verified");
  output = output.replace(/customer proof if available/gi, "customer proof only when you have it");
  output = output.replace(/measured result if available/gi, "measured result only when you have it");
  output = output.replace(/measurable proof if available/gi, "measurable proof only when you have it");
  output = output.replace(/case study if available/gi, "case study only when you have it");
  output = output.replace(/refund policy if available/gi, "published refund policy");
  output = output.replace(/support policy if available/gi, "published support policy");
  output = output.replace(/if available/gi, "only when you have it");

  // Remove template-style uncertainty from paid reports.
  output = output.replace(/Current hero \(hypothetical\):/gi, "Recommended hero direction:");
  output = output.replace(/Current hero \(inferred\):/gi, "Recommended hero direction:");
  output = output.replace(/Current CTA likely:/gi, "CTA issue to address:");
  output = output.replace(/Current CTA likely/gi, "CTA issue to address");
  output = output.replace(/The current positioning likely treats/gi, "The current positioning may make users perceive");
  output = output.replace(/Current:\s*may\s+/gi, "Current risk: the page may ");

  // Avoid unsupported delivery or email-flow promises.
  output = output.replace(/If you send the Pro Fix Plan via email, make sure the email subject line and preview text match the page promise\.?/gi, "If you add email delivery later, keep the email subject and preview text consistent with the checkout promise.");
  output = output.replace(/You'll receive your Pro Fix Plan immediately\./gi, "After PayPal confirmation, generate and view your Pro Fix Plan immediately.");
  output = output.replace(/You get the PDF with variants and test plan/gi, "You view, copy, or export the Pro Fix Plan with variants and a test plan");

  // Remove risky fictional anchoring advice.
  output = output.replace(/Price anchoring:\s*Place the Pro Fix Plan next to a fictional[^\n]+/gi, "Price anchoring: Avoid fictional comparison offers. If you use an anchor, make sure it reflects a real service or real alternative.");
  output = output.replace(/show a "done-for-you" option at \$29 \(greyed out\) next to \$29 Pro Plan/gi, "show a real alternative only if it exists and is accurately priced");

  // Correct plan pricing and plan labels.
  output = output.replace(/\$29 Quick Fix Report/gi, "$9 Quick Fix Report");
  output = output.replace(/Quick Fix Report \(\$29\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/Quick Fix \(\$29\)/gi, "Quick Fix ($9)");
  output = output.replace(/Quick Fix = one quick win/gi, "Quick Fix = focused first fix");
  output = output.replace(/The \$29 Quick Fix Report gives one surface-level recommendation\./gi, "The $9 Quick Fix Report gives a focused first fix.");
  output = output.replace(/The \$29 Pro Fix Plan/gi, "The $29 Pro Fix Plan");

  // Remove unsupported scarcity, timers, discounts, and upgrade windows.
  output = output.replace(/Limited spots[^.\n]*\./gi, "Avoid scarcity claims unless you have a real operational limit.");
  output = output.replace(/Get Pro Fix Plan for \$29 if you upgrade within 1 hour of your free diagnosis\./gi, "Keep the Pro Fix Plan price clear and stable at $29.");
  output = output.replace(/Same free diagnosis\. Upgrade anytime within 7 days of receiving your diagnosis\./gi, "Same free diagnosis. Upgrade when you are ready from the checkout flow.");
  output = output.replace(/within 7 days of receiving your free diagnosis/gi, "from the checkout flow");
  output = output.replace(/\$29 for first hour/gi, "$29");
  output = output.replace(/time[- ]limited upgrade discount[^.\n]*/gi, "clear one-time $29 Pro Fix Plan offer");

  // Remove unsupported email/PDF delivery promises.
  output = output.replace(/Deliver the Pro Fix Plan PDF\./gi, "Generate and display the Pro Fix Plan after payment confirmation.");
  output = output.replace(/Deliver the Pro Fix Plan PDF/gi, "Generate and display the Pro Fix Plan");
  output = output.replace(/free diagnosis results email or page/gi, "free diagnosis results page");
  output = output.replace(/results email or page/gi, "results page");
  output = output.replace(/sent as a series of emails or in-app checklist/gi, "included as an in-report checklist");
  output = output.replace(/email delivery of free diagnosis/gi, "free diagnosis result delivery");

  // Remove template/inference leakage.
  output = output.replace(/Current \(assumed from context\):/gi, "Current page direction:");
  output = output.replace(/Current \(inferred\):/gi, "Current page direction:");
  output = output.replace(/Current \(inferred\)/gi, "Current page direction");
  output = output.replace(/Current \(assumed from context\)/gi, "Current page direction");

  // Remove deceptive or risky community-promotion suggestions.
  output = output.replace(/Willing to give free Pro Fix Plans to the first 5 people who comment with their URL \(and report back results\)\./gi, "Invite feedback transparently and offer a free diagnosis without asking for public performance claims.");
  output = output.replace(/For \$29 it's a no[- ]brainer if you're stuck\./gi, "For $29, it may be useful if you want structured variants to test.");
  output = output.replace(/Not a personal endorsement, but the structure helped me think about tests I hadn't considered\./gi, "I am the maker, so treat this as a transparent product suggestion rather than a personal endorsement.");

  // Clean PDF/export-hostile characters from generated text.
  output = output.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ");
  output = output.replace(/[→↔]/g, "->");
  output = output.replace(/[–—]/g, "-");
  output = output.replace(/[“”]/g, '"');
  output = output.replace(/[‘’]/g, "'");
  output = output.replace(/!’/g, "->");
  output = output.replace(/\bbenefit led\b/gi, "benefit-led");
  output = output.replace(/\bcontrast led\b/gi, "contrast-led");
  output = output.replace(/\bmicro copy\b/gi, "microcopy");
  output = output.replace(/\bone off\b/gi, "one-off");
  output = output.replace(/\bfollow up\b/gi, "follow-up");
  output = output.replace(/\bcopy paste\b/gi, "copy-paste");

  // Clean common sanitizer artifacts.
  output = output.replace(/Pro Fix Plan - Pro Fix Plan \(\$29\)/gi, "Pro Fix Plan - $29");
  output = output.replace(/Get your Pro Fix Plan - Pro Fix Plan \(\$29\)/gi, "Get your Pro Fix Plan - $29");
  output = output.replace(/Get the Pro Fix Plan - Pro Fix Plan \(\$29\)/gi, "Get the Pro Fix Plan - $29");
  output = output.replace(/Quick Fix Report \(Pro Fix Plan \(\$29\)\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/Pro Fix Plan \(Pro Fix Plan \(\$29\)\)/gi, "Pro Fix Plan ($29)");
  output = output.replace(/Pro Fix Plan \+ Quick Fix Report = Pro Fix Plan \(\$29\)/gi, "Pro Fix Plan includes the Quick Fix Report scope for $29");
  output = output.replace(/Pro Fix Plan \(\$29\) Pro Fix Plan/gi, "Pro Fix Plan ($29)");
  output = output.replace(/Pro Fix Plan \(\$29\) quick fix/gi, "Quick Fix Report ($9)");
  output = output.replace(/Pro Fix Plan \(\$29\) pro/gi, "Pro Fix Plan ($29)");
  output = output.replace(/e500 visitors\/week/gi, "500+ visitors/week");
  output = output.replace(/verified performance resultfewer/gi, "fewer");

  const proof = "real customer proof";
  const metric = "a verified performance result";
  const policy = "your published support or refund policy";
  const price = input?.tier === "pro" ? "$29" : input?.tier === "basic" ? "$9" : "the selected one-time plan price";

  // Remove invented brand/customer proof.
  output = output.replace(/\b(HubSpot|Mailchimp|Zapier|AdEspresso|Hootsuite|Salesforce|Slack|Notion|Stripe)\b/gi, "customer proof only if verified");
  output = output.replace(/\btrusted by\s+\d+\+?[^.\n]*/gi, `trusted by ${proof}`);
  output = output.replace(/\bused by\s+[^.\n]*\d+\+?[^.\n]*/gi, `used by ${proof}`);
  output = output.replace(/\bclients include\b[^.\n]*/gi, `clients include ${proof}`);
  output = output.replace(/\blogos? of recognizable brands[^.\n]*/gi, proof);
  output = output.replace(/\bclient:\s*[^\n]+/gi, `Client: ${proof}`);
  output = output.replace(/\bcase study\b[^.\n]*(\d|%|x|revenue|signup|conversion|client)[^.\n]*/gi, `case study using ${metric}`);
  output = output.replace(/\bvideo case study\b/gi, "verified case study only when verified");

  // Remove invented performance numbers and lift promises.
  output = output.replace(/\b\d+(?:\.\d+)?%\s*(?:to|→|-|–|—)\s*\d+(?:\.\d+)?%/gi, metric);
  output = output.replace(/\b\d+(?:\.\d+)?\s*(?:-|–|—)\s*\d+(?:\.\d+)?%\s*(better|lift|increase|improvement|conversion)?/gi, metric);
  output = output.replace(/\b\d+(?:\.\d+)?x\b/gi, metric);
  output = output.replace(/\b\d+%\s+(increase|lift|boost|growth|improvement|conversion|signup|signups|sales|revenue)[^.\n]*/gi, metric);
  output = output.replace(/\b(double|triple|quadruple)\s+[^.\n]*(signups|sales|revenue|conversion|conversions|customers)[^.\n]*/gi, metric);
  output = output.replace(/\bturn\s+\d+(?:\.\d+)?%\s+of\s+[^.\n]*/gi, "turn more qualified visitors into customers");
  // Remove invented commercial models and performance-based payment claims.
  output = output.replace(/\byou only pay when[^.\n]*/gi, `Use ${policy}.`);
  output = output.replace(/\bwe only get paid when[^.\n]*/gi, `Use ${policy}.`);
  output = output.replace(/\bpay only when[^.\n]*/gi, `Use ${policy}.`);
  output = output.replace(/\bcharge only when[^.\n]*/gi, `Use ${policy}.`);
  output = output.replace(/\bcharged? only if[^.\n]*/gi, `Use ${policy}.`);
  output = output.replace(/\bonly when the new page (wins|outperforms)[^.\n]*/gi, `only with ${policy}.`);
  output = output.replace(/\bno upfront (price|payment|fee|cost)[^.\n]*/gi, `Use ${policy}.`);
  output = output.replace(/\bfree audit, then pay only[^.\n]*/gi, `Free diagnosis first, then use ${policy}.`);
  output = output.replace(/\brisk[- ]reversed entry point\b/gi, "low-friction entry point");
  output = output.replace(/\bspending at least\s+\[?your actual price\]?\s*k\/month[^.\n]*/gi, "with a clearly defined target customer only when verified");
  output = output.replace(/\b\d+%\\+? of visitors\b/gi, "many visitors");
  output = output.replace(/\bleak\s+\d+%\\+? of visitors\b/gi, "lose visitors before they convert");
  output = output.replace(/\bmore closed deals\b/gi, "more qualified conversion actions");
  output = output.replace(/\bfaster close rates\b/gi, "a clearer path to the next sales step");
  output = output.replace(/\bhigher revenue from the same traffic\b/gi, "better use of the same traffic");
  output = output.replace(/\bturns? ad traffic into booked calls and closed deals\b/gi, "helps more ad visitors take the next conversion step");
  output = output.replace(/\bturn your ad clicks into pipeline[^.\n]*/gi, "help more ad visitors take the next conversion step");
  output = output.replace(/\bYou your actual support or refund policy only when verified\b/gi, `Use ${policy}`);


  // Remove unsupported guarantees, refund terms, and free offers.
  output = output.replace(/\b(or it'?s free|or you do not pay|or you don't pay|you don’t pay|work for free until|first month free|pay only after|refund 100%|100% refund|100% satisfaction|money[- ]back guarantee|performance guarantee|results guaranteed in writing)\b[^.\n]*/gi, policy);
  output = output.replace(/\b\d{1,3}[- ]?day performance guarantee\b/gi, policy);
  output = output.replace(/\bif your conversion rate doesn[’']t improve[^.\n]*/gi, policy);
  output = output.replace(/\bif you don[’']t see[^.\n]*(increase|lift|boost|growth|improvement|result)[^.\n]*/gi, policy);

  // Remove unsupported pricing and invented package claims.
  output = output.replace(/\$\d[\d,]*(?:\.\d{2})?/g, price);
  output = output.replace(/\$X,XXX/g, price);
  output = output.replace(/\bone[- ]time landing page overhaul\s*[–-]\s*\[?your actual price\]?[^.\n]*/gi, `One-time landing page improvement package — ${price}`);
  output = output.replace(/\bmonthly retainer\b/gi, "ongoing support option only when verified");
  output = output.replace(/\bno long[- ]term contracts?\b/gi, "clear contract terms only when verified");
  output = output.replace(/\bcancel anytime\b/gi, "clear cancellation terms only when verified");

  // Remove fake founder/history claims in launch copy.
  output = output.replace(/\bI spent\s+\d+\s+years[^.\n]*/gi, "I have been reviewing common landing page conversion issues");
  output = output.replace(/\bwe spent\s+\d+\s+(weeks|months|years)[^.\n]*/gi, "We reviewed common landing page conversion issues");
  output = output.replace(/\bwe recently helped[^.\n]*/gi, `A useful example would show ${metric}`);
  output = output.replace(/\bwe did a full rewrite for[^.\n]*/gi, `A useful example would show ${metric}`);
  output = output.replace(/\bwent from\s+[^.\n]*(%|x|signup|conversion)[^.\n]*/gi, metric);

  // Tone down hype.
  output = output.replace(/\bclosing machine\b/gi, "clearer conversion path");
  output = output.replace(/\bproven copywriting\b/gi, "conversion-focused copywriting");
  output = output.replace(/\bbacked by real conversion data\b/gi, "validated with analytics only when verified");
  output = output.replace(/\bNo AI hype, just results\./gi, "Clear diagnosis and practical fixes.");
  // Tone down remaining unsupported proof/hype language.
  output = output.replace(/\bsales machine\b/gi, "clearer conversion path");
  output = output.replace(/\bproven system\b/gi, "structured conversion process");
  output = output.replace(/\bproven principles\b/gi, "conversion best practices");
  output = output.replace(/\bearly results from testers show positive direction[^.\n]*/gi, "early user feedback is welcome");
  output = output.replace(/\bwe[’']re not promising overnight miracles, but early user feedback is welcome\./gi, "We are looking for honest feedback from teams improving paid landing pages.");


  // Final cleanup for placeholders, scarcity, delivery, and broken export artifacts.
  output = output.replace(/\[your actual turnaround time[^\]]*\]/gi, "immediately after payment confirmation");
  output = output.replace(/\[X\]%?/gi, "a verified result");
  output = output.replace(/\[URL\]/gi, "https://aiconversionclinic.com");

  output = output.replace(/delivered within\s+immediately after payment confirmation[^.\n]*/gi, "generated immediately after payment confirmation");
  output = output.replace(/delivered within[^.\n]*24 hours[^.\n]*/gi, "generated immediately after payment confirmation");
  output = output.replace(/How long does it take to get the plan\?\s*A:\s*The diagnosis is instant\. The Pro Fix Plan is generated immediately after payment confirmation[^\n]*/gi, "How long does it take to get the plan? A: The Pro Fix Plan is generated immediately after payment confirmation.");

  output = output.replace(/Quick Fix Report \(Free\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/Feature - Quick Fix Report \(Free\) - Pro \(\$29\)/gi, "Feature - Quick Fix Report ($9) - Pro Fix Plan ($29)");
  output = output.replace(/The \$29 Quick Fix gives/gi, "The $9 Quick Fix Report gives");
  output = output.replace(/\$29 Quick Fix gives/gi, "$9 Quick Fix Report gives");
  output = output.replace(/Quick Fix gives/gi, "Quick Fix Report gives");

  output = output.replace(/Recommended hero direction:\./gi, "Recommended hero direction:");
  output = output.replace(/using the page has:/gi, "Recommended page structure:");
  output = output.replace(/using the page has/gi, "Recommended page structure");
  output = output.replace(/Current:\s*Maybe a short list\./gi, "Current risk: the value list may be too short.");

  output = output.replace(/Limited availability/gi, "Standard availability");
  output = output.replace(/Next batch analysis opens in 48 hours[^\n]*/gi, "Available after checkout");
  output = output.replace(/Limited time:[^.\n]*/gi, "Bonus framing:");
  output = output.replace(/We only take 20 Pro Fix Plan orders per week[^.\n]*/gi, "Avoid capacity claims unless you have a real operational limit");
  output = output.replace(/Only 20 plans left this week[^.\n]*/gi, "No scarcity claim");
  output = output.replace(/Price increases to \$29 after you leave this page[^.\n]*/gi, "Keep pricing clear and stable at $29");
  output = output.replace(/Limited quantity/gi, "Capacity note");
  output = output.replace(/Time-sensitive/gi, "Stable pricing");

  output = output.replace(/Priority support - \(if applicable[^\n]*/gi, "Support note - refer to the published support policy.");
  output = output.replace(/if applicable, but not a human review[^\n]*/gi, "refer to the published support policy");

  output = output.replace(/I've been using a tool called AI Conversion Clinic\./gi, "As the maker, I built AI Conversion Clinic to help diagnose landing page conversion blockers.");
  output = output.replace(/Might be worth a try if you have traffic but low conversions\./gi, "Useful if you want structured variants to test.");
  output = output.replace(/The same structured process used by top conversion optimizers\./gi, "A structured conversion-review process packaged into a $29 plan.");

  output = output.replace(/['’]\u0013/g, "-");
  output = output.replace(/'/g, "-");
  output = output.replace(/\s+-\s+-\s+'/g, " - No - Yes");
  output = output.replace(/\s+'\s+-\s+'/g, " - Yes - Yes");

  // Final cleanup for template/inference leakage.
  output = output.replace(/^Current\s+hero\s+(likely|probably|may|might)[^\n:]*:?/gim, "Current page risk:");
  output = output.replace(/^Current\s+CTA\s+(likely|probably|may|might)[^\n:]*:?/gim, "CTA issue to address:");
  output = output.replace(/^Current\s+\((assumed|inferred|hypothetical)[^)]+\):?/gim, "Current page direction:");
  output = output.replace(/^Current\s+hero\s+\((assumed|inferred|hypothetical)[^)]+\):?/gim, "Recommended hero direction:");
  output = output.replace(/^Current\s+CTA\s+\((assumed|inferred|hypothetical)[^)]+\):?/gim, "CTA issue to address:");
  output = output.replace(/\bCurrent hero likely\b/gi, "Current page risk");
  output = output.replace(/\bCurrent CTA likely\b/gi, "CTA issue to address");
  output = output.replace(/\bCurrent hero \(inferred\)/gi, "Recommended hero direction");
  output = output.replace(/\bCurrent hero \(hypothetical\)/gi, "Recommended hero direction");
  output = output.replace(/\bCurrent \(assumed from context\)/gi, "Current page direction");
  output = output.replace(/\bCurrent \(inferred\)/gi, "Current page direction");
  output = output.replace(/\bAssuming page structure\b/gi, "Recommended page structure");
  output = output.replace(/\bAssume the page currently has\b/gi, "Recommended page structure should include");
  output = output.replace(/\bAssume the page has\b/gi, "Recommended page structure should include");
  output = output.replace(/\bAssume\b/gi, "Use");
  output = output.replace(/\bassuming\b/gi, "using");
  output = output.replace(/\blikely treats\b/gi, "may make users perceive");
  output = output.replace(/\blikely leads with\b/gi, "may over-emphasize");
  output = output.replace(/\bmay list features\b/gi, "risks over-emphasizing features");

  // Final cleanup for product naming, pricing, proof, and launch-copy safety.
  output = output.replace(/\bBasic \(\$29\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/\$29 Basic\b/gi, "$9 Quick Fix Report");
  output = output.replace(/Basic\s*\/\s*\$29 Pro/gi, "Quick Fix Report ($9) / Pro Fix Plan ($29)");
  output = output.replace(/Basic gives you one fix suggestion/gi, "The Quick Fix Report gives you one focused fix recommendation");
  output = output.replace(/\bBasic page notes\b/gi, "Focused page notes");
  output = output.replace(/Can't I just use the Basic plan for \$29\?/gi, "Can't I just use the Quick Fix Report for $9?");
  output = output.replace(/Basic \(\$9\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/\bBasic\b/g, "Quick Fix Report");

  output = output.replace(/Current hero likely leads with/gi, "Current page risk: the hero may over-emphasize");
  output = output.replace(/CTA issue to address says something generic like/gi, "CTA issue to address: generic CTA copy such as");
  output = output.replace(/Assuming page structure:[^.\n]*\./gi, "Recommended page structure:");
  output = output.replace(/Assuming page structure:/gi, "Recommended page structure:");

  output = output.replace(/trusted by founders who doubled their conversion rate[^.\n]*\./gi, "used by real customers only when you have verified proof.");
  output = output.replace(/What 98% of Landing Pages Get Wrong[^\n]*/gi, "What Most Landing Pages Get Wrong");
  output = output.replace(/I analyzed 100\+ landing pages[^-\n]*/gi, "I built a tool to identify common landing page conversion blockers ");
  output = output.replace(/Over 500 landing pages diagnosed[^.\n]*/gi, "Show your real diagnosis count only when verified");
  output = output.replace(/first 100 customers/gi, "real launch customers");
  output = output.replace(/Price increases after launch[^.\n]*/gi, "Keep launch pricing clear and avoid fake scarcity");

  output = output.replace(/Full refund if you don't follow the plan[^.\n]*/gi, "Refer to the published refund policy before making refund claims");
  output = output.replace(/14-day your published support or refund policy\.?\)?/gi, "Refer to the published support or refund policy.");
  output = output.replace(/We offer a 14-day refund if you haven't followed the plan/gi, "Refer to the published refund policy");

  output = output.replace(/GA4 Funnel Exploration, Microsoft Clarity, VWO, or Optimizely, VWO/gi, "GA4 Funnel Exploration, Microsoft Clarity, VWO, or Optimizely");
  output = output.replace(/Optimizely, VWO/gi, "Optimizely");
  output = output.replace(/VWO, or Optimizely, VWO/gi, "VWO, or Optimizely");

  output = output.replace(/One tool I've used is AI Conversion Clinic\./gi, "As the maker, I built AI Conversion Clinic to help identify landing page conversion blockers.");
  output = output.replace(/I found the Pro plan really helpful because/gi, "The Pro plan is designed to help by");
  output = output.replace(/caught that for me/gi, "can identify that issue");
  output = output.replace(/Worth it if you're stuck\./gi, "Useful if you want structured variants to test.");
  output = output.replace(/no catch, just the tool/gi, "feedback welcome");

  // Final cleanup for unsupported upgrade-window promises.
  output = output.replace(/upgrade anytime within\s+7\s+days[^.\n]*/gi, "upgrade from the checkout flow when you are ready");
  output = output.replace(/upgrade within\s+7\s+days[^.\n]*/gi, "upgrade from the checkout flow when you are ready");
  output = output.replace(/within\s+7\s+days\s+of\s+receiving\s+(your\s+)?(free\s+)?diagnosis/gi, "from the checkout flow");
  output = output.replace(/within\s+7\s+days/gi, "from the checkout flow");
  output = output.replace(/upgrade anytime/gi, "upgrade from the checkout flow");
  output = output.replace(/Same free diagnosis\. Upgrade from the checkout flow when you are ready\./gi, "Same free diagnosis. Upgrade from the checkout flow when you are ready.");

  // Broadly remove any remaining Product Hunt / Reddit / community-promotion sections.
  output = output.replace(/\n?[-–—]{0,3}\s*Product Hunt[\s\S]*?(?=\n[-–—]{0,3}\s*Important Note|\nImportant Note|$)/gi, "\n");
  output = output.replace(/\n?[-–—]{0,3}\s*Reddit[\s\S]*?(?=\n[-–—]{0,3}\s*Important Note|\nImportant Note|$)/gi, "\n");
  output = output.replace(/\n?[-–—]{0,3}\s*Maker'?s? comment[\s\S]*?(?=\n[-–—]{0,3}\s*Important Note|\nImportant Note|$)/gi, "\n");
  // Remove default launch-promotion appendices from paid reports.
  output = output.replace(/\n?[-–—]{0,3}\s*Product Hunt Launch Copy[\s\S]*?(?=\n[-–—]{0,3}\s*Important Note|\nImportant Note|$)/gi, "\n");
  output = output.replace(/\n?[-–—]{0,3}\s*Reddit Post & Comment Variants[\s\S]*?(?=\n[-–—]{0,3}\s*Important Note|\nImportant Note|$)/gi, "\n");
  output = output.replace(/\n?[-–—]{0,3}\s*Product Hunt \/ Reddit Follow-up Copy[\s\S]*?(?=\n[-–—]{0,3}\s*Important Note|\nImportant Note|$)/gi, "\n");

  // Remove unsupported product capability and report-size claims.
  output = output.replace(/scan for 40\+ conversion obstacles/gi, "review common conversion blockers");
  output = output.replace(/checks 40\+ elements/gi, "reviews common conversion elements");
  output = output.replace(/40\+ conversion issues/gi, "common conversion issues");
  output = output.replace(/visual heatmap/gi, "structured issue summary");
  output = output.replace(/heatmap of issues/gi, "structured issue summary");
  output = output.replace(/20\+ pages of actionable content/gi, "a detailed actionable report");
  output = output.replace(/20-page blueprint/gi, "detailed blueprint");
  output = output.replace(/12-15 specific fixes/gi, "prioritized specific fixes");
  output = output.replace(/12-15 fixes/gi, "prioritized fixes");
  output = output.replace(/battle-tested/gi, "structured");

  // Remove delivery-flow inaccuracies.
  output = output.replace(/Immediate PDF download/gi, "Immediate report generation after payment confirmation");
  output = output.replace(/immediate PDF download/gi, "immediate report generation after payment confirmation");
  output = output.replace(/download starts immediately/gi, "the report can be generated immediately after payment confirmation");
  output = output.replace(/One-time payment\. Immediate PDF download\./gi, "One-time payment. Generate and view the report after payment confirmation.");
  output = output.replace(/complete conversion overhaul/gi, "complete conversion fix plan");

  // Remove remaining sanitizer artifacts.
  output = output.replace(/verified detail only when you have it/gi, "");
  output = output.replace(/fix verified detail only when you have it/gi, "fix conversion blockers");

  // Final cleanup for delivery-flow accuracy, apostrophe artifacts, and transparent promotion.
  output = output.replace(/Within\s+24[-–—]?48\s+hours,?\s+you\s+receive\s+a\s+PDF[^.\n]*/gi, "After PayPal confirmation, generate and view the Pro Fix Plan immediately");
  output = output.replace(/delivered\s+in\s+24[-–—]?48\s+hours/gi, "generated immediately after payment confirmation");
  output = output.replace(/delivered\s+within\s+24[-–—]?48\s+hours/gi, "generated immediately after payment confirmation");
  output = output.replace(/you\s+receive\s+a\s+PDF\s+with\s+all\s+variants[^.\n]*/gi, "you generate and view the full Pro Fix Plan with variants, structure recommendations, and a test plan");
  output = output.replace(/You-ll be asked to paste your page URL and briefly describe what your traffic looks like/gi, "Your page URL and context are already collected during the diagnosis flow");
  output = output.replace(/you paste your URL,?\s*we study your page/gi, "the system analyzes your submitted page and context");
  output = output.replace(/we study your page/gi, "the system analyzes your submitted page and context");

  output = output.replace(/Here-s/g, "Here's");
  output = output.replace(/doesn-t/g, "doesn't");
  output = output.replace(/isn-t/g, "isn't");
  output = output.replace(/don-t/g, "don't");
  output = output.replace(/can-t/g, "can't");
  output = output.replace(/you-ve/g, "you've");
  output = output.replace(/You-ve/g, "You've");
  output = output.replace(/you-ll/g, "you'll");
  output = output.replace(/You-ll/g, "You'll");
  output = output.replace(/you-re/g, "you're");
  output = output.replace(/You-re/g, "You're");
  output = output.replace(/I-m/g, "I'm");
  output = output.replace(/I-d/g, "I'd");
  output = output.replace(/it-s/g, "it's");
  output = output.replace(/It-s/g, "It's");
  output = output.replace(/visitor-s/g, "visitor's");
  output = output.replace(/customer-s/g, "customer's");
  output = output.replace(/audience-s/g, "audience's");
  output = output.replace(/page-s/g, "page's");
  output = output.replace(/plan-s/g, "plan's");

  output = output.replace(/Current \(hypothetical\):?\s*/gi, "Current page risk: ");
  output = output.replace(/Current \(likely\):?\s*/gi, "Current page risk: ");
  output = output.replace(/Current \(inferred\):?\s*/gi, "Current page risk: ");

  output = output.replace(/Not mine, but it's called the Pro Fix Plan[^.\n]*/gi, "As the maker, I built the Pro Fix Plan to provide structured page-specific recommendations");
  output = output.replace(/I know a tool that generates them\.\s*Not mine[^.\n]*/gi, "As the maker, I built AI Conversion Clinic to generate structured page-specific recommendations");
  output = output.replace(/Not here to push it[^.\n]*/gi, "Sharing transparently as the maker");
  output = output.replace(/I'm a conversion copywriter\./gi, "I'm building AI Conversion Clinic.");
  output = output.replace(/what helped a few founders/gi, "what the tool is designed to help with");
  output = output.replace(/Try it - we think it's worth \$29/gi, "Try the free diagnosis first, then decide whether the $29 Pro Fix Plan is useful");

  output = output.replace(/real verified detail\s+/gi, "");
  output = output.replace(/<a verified performance result/gi, "a low conversion rate");
  output = output.replace(/a verified result founders/gi, "real founders only when you have verified proof");
  output = output.replace(/verified detail only when you have it\s+Check/g, "Check");

  output = output.replace(/Fast Track[^.\n]*12-hour delivery[^.\n]*/gi, "Optional faster delivery should only be offered if the product supports it");
  output = output.replace(/first\s+50\s+customers/gi, "real launch customers only if verified");
  output = output.replace(/This plan is available for the first 50 customers this month[^.\n]*/gi, "Avoid scarcity claims unless the limit is real and enforced");
  output = output.replace(/Limited-time bonus/gi, "Bonus");
  output = output.replace(/Optimizely or any A\/B tool/gi, "Optimizely, or another A/B testing tool");
  output = output.replace(/Optimizely or any A\/B tool/gi, "Optimizely, or another A/B testing tool");
  output = output.replace(/Optimizely or any A\/B tool/gi, "Optimizely, or another A/B testing tool");
  output = output.replace(/Optimizely or any/g, "Optimizely or another");

  // Final cleanup for any remaining bracket placeholders.
  output = output.replace(/\[URL\]/gi, "https://aiconversionclinic.com");
  output = output.replace(/\[X\]%?/gi, "a verified result");
  output = output.replace(/\[your actual price\]/gi, input?.tier === "pro" ? "$29" : input?.tier === "basic" ? "$9" : "the selected plan price");
  output = output.replace(/\[price\]/gi, input?.tier === "pro" ? "$29" : input?.tier === "basic" ? "$9" : "the selected plan price");
  output = output.replace(/\[your actual turnaround time[^\]]*\]/gi, "immediately after payment confirmation");
  output = output.replace(/\[customer name\]/gi, "real customer name only with permission");
  output = output.replace(/\[company\]/gi, "real company name only with permission");
  output = output.replace(/\[list real company names only when you have it\]/gi, "real company names only with permission");
  output = output.replace(/\[\s*\]/g, "");
  output = output.replace(/\[[^\]\n]{1,120}\]/g, "");

  // Final paid-report cleanup. Keep this near the end so later sanitizer rules cannot reintroduce bad output.
  output = output.replace(/\$29\s+Quick Fix Report/gi, "$9 Quick Fix Report");
  output = output.replace(/Quick Fix Report\s*\(\$29\)/gi, "Quick Fix Report ($9)");
  output = output.replace(/Quick Fix\s*\(\$29\)/gi, "Quick Fix ($9)");
  output = output.replace(/Quick Fix\s*=\s*\$29/gi, "Quick Fix = $9");
  output = output.replace(/Quick Fix Report\s*=\s*\$29/gi, "Quick Fix Report = $9");
  output = output.replace(/Feature - Quick Fix \(\$29\) - Pro Fix \(\$29\)/gi, "Feature - Quick Fix ($9) - Pro Fix ($29)");
  output = output.replace(/Free - Quick Fix \(\$29\) - Pro Fix \(\$29\)/gi, "Free - Quick Fix ($9) - Pro Fix ($29)");
  output = output.replace(/Quick Fix \(\$9\) Report/gi, "Quick Fix Report ($9)");
  output = output.replace(/\$9 Quick Fix Report gives a focused first fix/gi, "The $9 Quick Fix Report gives a focused first fix");

  return output;
}


async function generateWithAI(input: AuditInput) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!deepseekKey && !openaiKey) {
    const reportV2 = finalizeAuditReportForDelivery(demoReportV2(input), input);
    return {
      report: formatReportV2AsText(reportV2) || demoReport(input),
      reportV2,
      demo: true
    };
  }

  const generationMode = input.generationMode === "diagnosis" ? "diagnosis" : "solution";
  const normalizedInput: AuditInput = {
    ...input,
    tier: generationMode === "diagnosis" ? "basic" : input.tier
  };

  const diagnosisInstruction = `
MODE: FREE DIAGNOSIS ONLY.
Return valid JSON matching the required schema, but only reveal diagnostic information.
Focus on score, executive summary, top conversion blockers, severity, and fix plan preview.
Do not reveal full hero rewrites, full CTA rewrites, pricing strategy, full FAQ, full hooks, or a complete 7-day implementation plan.
Keep paid fix plan sections minimal or preview-level only.`;

  const prompt = generationMode === "diagnosis"
    ? `${buildAuditPromptV2(normalizedInput)}\n\n${diagnosisInstruction}`
    : buildSolutionPrompt(normalizedInput);

  const fallbackPrompt = generationMode === "diagnosis"
    ? buildDiagnosisPrompt(normalizedInput)
    : buildSolutionPrompt(normalizedInput);

  const systemMessage = generationMode === "diagnosis"
    ? "You are a senior CRO consultant. Return valid JSON only. Do not include Markdown or code fences."
    : "You are a senior CRO consultant and direct-response copywriter. Return clean Markdown only. Do not return JSON.";

  const temperature = 0.35;
  const maxTokens = generationMode === "diagnosis" ? 3200 : normalizedInput.tier === "pro" ? 9000 : 6200;

  // Prefer DeepSeek when configured.
  if (deepseekKey) {
    const baseUrl = (process.env.LLM_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
    const model = process.env.LLM_MODEL || "deepseek-v4-flash";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";
    if (!rawText) throw new Error("DeepSeek API returned an empty report");

    if (generationMode === "solution") {
      return {
        report: sanitizeSolutionMarkdown(rawText, normalizedInput),
        reportV2: null,
        demo: false
      };
    }

    const parsed = parseModelReport(rawText, normalizedInput);

    // If structured JSON fails, automatically generate an old-style text report as a safe fallback.
    // This prevents customers from seeing raw or incomplete JSON.
    if (!parsed.reportV2) {
      console.error("REPORT_V2_FAILED_FALLING_BACK_TO_TEXT");

      const fallbackResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a senior conversion rate optimization consultant and direct-response copywriter. Write the entire report in English. Be specific, practical, and conversion-focused. Do not return JSON."
            },
            {
              role: "user",
              content: fallbackPrompt
            }
          ],
          temperature: 0.4,
          max_tokens: input.tier === "pro" ? 4200 : 2200,
          stream: false
        })
      });

      if (!fallbackResponse.ok) {
        const text = await fallbackResponse.text();
        throw new Error(`DeepSeek fallback API error: ${fallbackResponse.status} ${text}`);
      }

      const fallbackData = await fallbackResponse.json();
      const fallbackReport = fallbackData.choices?.[0]?.message?.content || "";
      if (!fallbackReport) throw new Error("DeepSeek fallback returned an empty report");

      return { report: fallbackReport, reportV2: null, demo: false };
    }

    return { ...parsed, demo: false };
  }

  // Keep OpenAI as a fallback provider.
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
      temperature,
      max_output_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const rawText = data.output_text || data.output?.flatMap((item: any) => item.content || []).map((content: any) => content.text || "").join("\n") || "";
  if (!rawText) throw new Error("OpenAI API returned an empty report");

  if (generationMode === "solution") {
    return {
      report: sanitizeSolutionMarkdown(rawText, normalizedInput),
      reportV2: null,
      demo: false
    };
  }

  const parsed = parseModelReport(rawText, normalizedInput);
  return { ...parsed, demo: false };
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as AuditInput;
    const error = validateInput(input);
    if (error) return Response.json({ ok: false, error }, { status: 400 });

    const generationMode = input.generationMode === "diagnosis" ? "diagnosis" : "solution";
    const devSkipPayment = process.env.NODE_ENV === "development" && process.env.DEV_SKIP_PAYMENT === "true";
    const paymentRequired = generationMode === "solution" && !devSkipPayment && Boolean(process.env.PAYPAL_CLIENT_SECRET && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

    if (paymentRequired) {
      if (!input.paymentToken) {
        return Response.json({
          ok: false,
          error: "Payment verification is required before generating the full fix plan."
        }, { status: 402 });
      }

      verifyPaymentToken(input.paymentToken, input.tier);
    }

    console.log("NEW_AUDIT_ORDER", {
      generationMode,
      email: input.email,
      paypalEmail: input.paypalEmail,
      paypalTransactionId: input.paypalTransactionId,
      paypalOrderId: input.paypalOrderId,
      tier: input.tier,
      url: input.url,
      createdAt: new Date().toISOString()
    });

    const result = generationMode === "diagnosis"
      ? await runDiagnosisWithCache(input, request)
      : await generateWithAI(input);

    if (generationMode === "solution") {
      result.report = finalizePaidReportBeforeQualityGate(result.report);
      // Stable deterministic Pro report override.
      // Stable deterministic paid report override
      if (input.tier === "pro") {
        result.report = buildStableProFixPlanReport(input);
        result.reportV2 = null;
      } else {
        result.report = buildStableQuickFixReport(input);
        result.reportV2 = null;
      }
      result.report = forcePaidReportLastPass(result.report);
      result.report = forcePaidReportLastPass(result.report);
      // Final pre-assert guard for pricing phrases that must be normalized before the gate.
      result.report = result.report.replace(/\$29\s+tier\b/gi, () => "$9 Quick Fix Report");
      result.report = result.report.replace(/\$29\s+version\b/gi, () => "$9 Quick Fix Report");
      result.report = result.report.replace(/\$29\s+vs\.?\s+\$29\b/gi, () => "$9 vs. $29");
      result.report = result.report.replace(/\$29\s+and\s+\$29/gi, () => "$9 and $29");
      result.report = result.report.replace(/\$29\s+or\s+\$29/gi, () => "$9 or $29");
      // Absolute final grammar guard immediately before quality gate.
      result.report = result.report.replace(/is may/gi, "may be");
      result.report = result.report.replace(/may generic/gi, "may be generic");
      result.report = result.report.replace(/may uses/gi, "may use");
      result.report = result.report.replace(/may satisfies/gi, "may satisfy");
      result.report = result.report.replace(/may has/gi, "may have");
      // Absolute final PDF QA residue guard immediately before quality gate.
      result.report = result.report
        .replace(/pay \$29 for the Pro Fix Plan instead of \$29 for the Quick Fix Report/gi, "pay $29 for the Pro Fix Plan instead of $9 for the Quick Fix Report")
        .replace(/instead of \$29 for the Quick Fix Report/gi, "instead of $9 for the Quick Fix Report")
        .replace(/\$29 for the Quick Fix Report/gi, "$9 for the Quick Fix Report")
        .replace(/extra \$29 buys/gi, "extra $20 buys")
        .replace(/Quick Fix Report\):\s*\$29/gi, "Quick Fix Report): $9")
        .replace(/Quick Fix Report:\s*\$29/gi, "Quick Fix Report: $9")
        .replace(/Option 1 \(Quick Fix Report\):\s*\$29/gi, "Option 1 (Quick Fix Report): $9")
        .replace(/\$29 plan over the \$29 plan/gi, "$29 Pro Fix Plan over the $9 Quick Fix Report")
        .replace(/percentage of \$29 purchases increasing/gi, "percentage of $29 Pro Fix Plan purchases increasing")
        .replace(/The 3Get Your Pro Fix Plan 3 button/gi, 'The "Get Your Pro Fix Plan" button')
        .replace(/the 3Get Quick Fix Report 3 button/gi, 'the "Get Quick Fix Report" button')
        .replace(/3Get Your Pro Fix Plan 3/gi, '"Get Your Pro Fix Plan"')
        .replace(/3Get Quick Fix Report 3/gi, '"Get Quick Fix Report"')
        .replace(/report-s/gi, "report's")
        .replace(/After payment confirmation,\s*no extra steps\.?/gi, "After payment confirmation, you can generate, view, copy, or export the full fix plan.")
        .replace(/There is After payment confirmation\s*-\s*the plan is available after generation for you to read and use\./gi, "After payment confirmation, you can generate, view, copy, or export the full fix plan.")
        .replace(/There is After payment confirmation or additional steps\./gi, "After payment confirmation, you can generate, view, copy, or export the full fix plan.")
        .replace(/No additional steps\.?/gi, "Use the generated report to apply fixes.")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .replace(/Ø=Ý\s*Secure PayPal checkout\s*•\s*One-time payment of \$29\s*•\s*/gi, "Secure PayPal checkout • One-time payment of $29 • Link to published refund/support policy")
        .replace(/Ø=Ý\s*/g, "")
        .replace(/Secured by PayPal/gi, "Secure PayPal checkout")
        .replace(/2-3 pages of example fixes/gi, "a short anonymized sample of example fixes")
        .replace(/2-3 paying customers/gi, "a small number of paying customers")
        .replace(/then proceeds to checkout/gi, "then proceed to checkout")
        .replace(/No improvement in conversion rates is explained/gi, "No specific improvement in conversion rates is claimed")
        .replace(/No improvement in ([^.]+?) is explained/gi, "No specific improvement in $1 is claimed");
      // Absolute final QA guard for latest generated PDF residues.
      result.report = result.report
        .replace(/pay \$29 for the Pro Fix Plan instead of \$29 for the Quick Fix Report/gi, "pay $29 for the Pro Fix Plan instead of $9 for the Quick Fix Report")
        .replace(/instead of \$29 for the Quick Fix Report/gi, "instead of $9 for the Quick Fix Report")
        .replace(/\$29 for the Quick Fix Report/gi, "$9 for the Quick Fix Report")
        .replace(/\$29\s+instead of\s+\$29/gi, "$29 instead of $9")
        .replace(/the \$29 Quick Fix Report/gi, "the $9 Quick Fix Report")
        .replace(/Quick Fix Report costs \$29/gi, "Quick Fix Report costs $9")
        .replace(/Quick Fix Report is \$29/gi, "Quick Fix Report is $9")
        .replace(/Visitors who complete the free diagnosis see a surface-level result\. Without a concrete example of what extra analysis the Pro Fix Plan provides, they Use the free version is sufficient\./gi, "Visitors who complete the free diagnosis see a surface-level result. Without a concrete example of what extra analysis the Pro Fix Plan provides, they may decide the free version is sufficient.")
        .replace(/\bthey Use the free version is sufficient\b/gi, "they may decide the free version is sufficient")
        .replace(/Medium\ufffeValidation metric/gi, "Medium\nValidation metric")
        .replace(/table\ufffeVariant/gi, "table\nVariant")
        .replace(/\ufffe/g, "\n")
        .replace(/Ø=Ý\s*Secure PayPal checkout\s*·\s*One-time payment\s*·\s*/gi, "Secure PayPal checkout · One-time payment · Link to published refund/support policy")
        .replace(/Ø=Ý\s*Secure PayPal checkout\s*•\s*One-time payment of \$29\s*•\s*/gi, "Secure PayPal checkout · One-time payment of $29 · Link to published refund/support policy")
        .replace(/Ø=Ý\s*/g, "")
        .replace(/We-ll/gi, "We'll")
        .replace(/get a free conversion diagnosis in 60 seconds/gi, "get a free conversion diagnosis")
        .replace(/in 60 seconds/gi, "")
        .replace(/No account or email delivery needed\s*-\s*the plan appears after payment confirmation on screen\./gi, "After payment confirmation, you can generate, view, copy, or export the full fix plan.")
        .replace(/No account needed\s*-\s*just your personalized Pro Fix Plan\./gi, "Use the generated Pro Fix Plan to review and apply your fixes.")
        .replace(/no account needed/gi, "use the generated report")
        .replace(/No email delivery needed/gi, "Use the generated report")
        .replace(/email delivery/gi, "report generation")
        .replace(/done-for-you solution/gi, "detailed action plan")
        .replace(/visual placement/gi, "page placement")
        .replace(/Delivered as a scrollable page/gi, "Shown as a generated report page")
        .replace(/The plan is delivered as a scrollable page/gi, "The plan is shown as a generated report page")
        .replace(/to increase clarity and urgency/gi, "to make the value proposition clearer")
        .replace(/your specific page/g, "your page")
        .replace(/your exact landing page URL/gi, "the landing page URL you submitted")
        .replace(/the data from your free diagnosis/gi, "your free diagnosis result");
      assertPaidReportQuality(result.report);
    }

    await sendLeadWebhook(input, result.report);

    return Response.json({
      ok: true,
      report: result.report,
      reportV2: result.reportV2,
      demo: result.demo,
      cached: "cached" in result ? result.cached : false,
      diagnosisId: "diagnosisId" in result ? result.diagnosisId : undefined,
      cacheExpiresAt: "cacheExpiresAt" in result ? result.cacheExpiresAt : undefined
    });
  } catch (error) {
    console.error("GENERATE_REPORT_ERROR", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
