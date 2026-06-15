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
    text = text.replace(/\bmoney[- ]back\s+guarantee\b/gi, "add a verified refund policy if available");
    text = text.replace(/\byour money back\b/gi, "your verified refund policy if available");
    text = text.replace(/\bno[- ]risk\s+guarantee\b/gi, "verified risk-reversal statement if available");
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

  text = text.replace(/\bbook(ed)?\s+(a\s+)?verified percentage\s+more\s+(demos|calls|sales|leads)\b/gi, "add a real customer result if available");
  text = text.replace(/\b\d+x\s+more\s+(demos|calls|sales|leads|revenue)\b/gi, "a verified performance result");
  text = text.replace(/\bknown\s+SaaS\s+brand\b/gi, "a real customer if available");
  text = text.replace(/\bfrom their company\b/gi, "from a real customer");
  text = text.replace(/\bTrusted by\.\.\./gi, "Add verified customer proof if available");



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
    text = text.replace(/\bmoney[- ]back\s+guarantee\b/gi, "a verified refund policy if available");
    text = text.replace(/\byour money back\b/gi, "your verified refund policy if available");
    text = text.replace(/\bno[- ]risk\s+guarantee\b/gi, "verified risk-reversal copy if available");
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
    text = text.replace(/\bbook(ed)?\s+\d+%?\s*more\s+(demos|calls|sales|leads)\b/gi, "add a real customer result if available");
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

  text = text.replace(/\btrusted by many companies\b/gi, "add verified customer proof if available");
  text = text.replace(/\btrusted by companies\b/gi, "add verified customer proof if available");
  text = text.replace(/\bknown SaaS brand\b/gi, "a real customer if available");
  text = text.replace(/\bclient logos\b/gi, "verified customer logos if available");
  text = text.replace(/\bcustomer logos\b/gi, "verified customer logos if available");
  text = text.replace(/\blogo row\b/gi, "verified proof row if available");

  // Clean awkward sanitizer leftovers.
  text = text.replace(/\bonly if you can verify this claim or your verified refund policy if available\b/gi, "only if backed by a verified refund policy");
  text = text.replace(/\bif it fits\b/gi, "if it is accurate");
  text = text.replace(/\bstate whether a credit card is required, free\b/gi, "state whether a credit card is required");


  // R4 final polish: remove aggressive sales claims and awkward sanitizer leftovers.
  text = text.replace(/\bverified\s+verified\b/gi, "verified");
  text = text.replace(/\byour verified audit offer\b/gi, "your actual offer");
  text = text.replace(/\byour verified call or demo offer\b/gi, "your actual call or demo process");
  text = text.replace(/\byour verified demo or consultation length\b/gi, "your actual call or demo length, if applicable");
  text = text.replace(/\byour verified consultation offer\b/gi, "your actual consultation offer, if applicable");
  text = text.replace(/\byour verified demo or consultation process\b/gi, "your actual demo or consultation process");
  text = text.replace(/\bverified customer logos if available if available\b/gi, "verified customer logos if available");
  text = text.replace(/\bverified proof row if available if available\b/gi, "verified proof row if available");

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
      return "a real customer if available";
    }

    if (cleaned.includes("quote") || cleaned.includes("testimonial")) {
      return "a real customer quote if available";
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
  text = text.replace(/\bsimilar companies\b/gi, "real comparable customers if available");
  text = text.replace(/\bspecific metrics from real customers\b/gi, "verified customer metrics if available");
  text = text.replace(/\bspecific metrics from real comparable customers if available\b/gi, "verified customer metrics if available");

  // Make remaining proof recommendations cleaner.
  text = text.replace(/\bUsed by\s+a real customer if available\b/gi, "Add verified customer proof if available");
  text = text.replace(/\bfrom\s+a real customer if available\b/gi, "from a real customer if available");
  text = text.replace(/\bAdd\s+a real customer if available\b/gi, "Add a real customer example if available");
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
  text = text.replace(/\baverage client sees?\s+[^.,;]+/gi, "add real customer results if available");
  text = text.replace(/\bclients?\s+see(s)?\s+[^.,;]+/gi, "real customers may show measurable results if you have proof");
  text = text.replace(/\bwithin\s+\d+[-–]\d+\s+weeks?\b/gi, "after implementation and testing");
  text = text.replace(/\bwithin\s+\d+\s+weeks?\b/gi, "after implementation and testing");
  text = text.replace(/\bwithin\s+\d+\s+days?\b/gi, "after implementation and testing");

  text = text.replace(/\b\d+%[\+]?[\s-]*(lift|increase|improvement|conversion lift)\b/gi, "measurable proof if available");
  text = text.replace(/\b\d+%[\+]?/g, "measurable proof");
  text = text.replace(/\b\d+x\s+(more|increase|lift|growth|results?)\b/gi, "measurable proof if available");

  text = text.replace(/\bif you don'?t see improvement after\s+[^.,;]+/gi, "only include a refund or guarantee if the business truly offers it");
  text = text.replace(/\bwe'?ll refund\s+[^.,;]+/gi, "state the refund policy only if it truly exists");
  text = text.replace(/\brefund your investment\b/gi, "state the refund policy only if it truly exists");
  text = text.replace(/\bcomplete rebuild\b/gi, "larger implementation project");

  text = text.replace(/\bwe analyzed\s+\d+\+?\s+landing pages\b/gi, "add real experience proof if available");
  text = text.replace(/\banalyzed\s+\d+\+?\s+landing pages\b/gi, "real experience proof if available");
  text = text.replace(/\bwe have helped\s+[^.,;]+/gi, "add verified customer proof if available");
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
  text = text.replace(/\bverified saved\b/gi, "verified time saved if available");

  // Keep the final report note deterministic.
  text = text.replace(/\bActual page content was not reviewed\.?/gi, "");
  text = text.replace(/\bPage copy was not reviewed\.?/gi, "");
  text = text.replace(/\bRecommendations are inferred from limited information\.?/gi, "");
  text = text.replace(/\bThis audit is based on limited information[^.]*\./gi, "");


  // R8 final delivery polish.
  text = text.replace(/\brequired required\b/gi, "required");
  text = text.replace(/\bif available if available\b/gi, "if available");
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
  text = text.replace(/\bacross verified information\b/gi, "with verified customer proof, if available");
  text = text.replace(/\bverified information\b/gi, "verified proof if available");
  text = text.replace(/\bverified information\./gi, "verified proof if available.");

  text = text.replace(/\bwe have worked with similar B2B teams\s+with verified customer proof, if available\b/gi, "Add relevant customer proof from similar B2B teams if available");
  text = text.replace(/\bwe have worked with similar B2B teams\b/gi, "Add relevant customer proof from similar B2B teams if available");
  text = text.replace(/\bwe have worked with similar companies\b/gi, "Add relevant customer proof from similar companies if available");
  text = text.replace(/\bwe have helped similar companies\b/gi, "Add relevant customer proof from similar customers if available");

  text = text.replace(/\bhere'?s a case study from a similar company\s+verified proof if available\b/gi, "Add a real case study from a similar customer if available");
  text = text.replace(/\bhere'?s a case study from a similar company\b/gi, "Add a real case study from a similar customer if available");
  text = text.replace(/\bwe can also tailor this to your vertical\b/gi, "Explain how the service adapts to the buyer's industry or use case");
  text = text.replace(/\bwe tailor this to your vertical\b/gi, "Explain how the service adapts to the buyer's industry or use case");

  text = text.replace(/\btrusted by hundreds of companies\b/gi, "supported by verified customer proof if available");
  text = text.replace(/\btrusted by hundreds\b/gi, "supported by verified customer proof if available");
  text = text.replace(/\bhundreds of companies\b/gi, "verified customer proof if available");

  text = text.replace(/\bimprove lead-to-deal conversion by a measurable result you can support with proof\b/gi, "improve lead-to-deal conversion with measurable proof if available");
  text = text.replace(/\bby a measurable result you can support with proof\b/gi, "with measurable proof if available");
  text = text.replace(/\bby measurable proof\b/gi, "with measurable proof if available");

  text = text.replace(/\bOur process\b/gi, "The page should explain the process");
  text = text.replace(/\bour process\b/gi, "the process");
  text = text.replace(/\bWe analyze\b/gi, "The page should show how the offer analyzes");
  text = text.replace(/\bwe analyze\b/gi, "the page should show how the offer analyzes");
  text = text.replace(/\bWe help\b/gi, "The offer helps");
  text = text.replace(/\bwe help\b/gi, "the offer helps");
  text = text.replace(/\bWe work\b/gi, "The page should clarify who it works");
  text = text.replace(/\bwe work\b/gi, "the page should clarify who it works");


  // R10 final neutral consultant voice cleanup.
  text = text.replace(/\bWe have experience with SaaS, fintech, and professional services\./gi, "Add relevant industry-specific proof if available.");
  text = text.replace(/\bwe have experience with SaaS, fintech, and professional services\./gi, "add relevant industry-specific proof if available.");
  text = text.replace(/\bwe'?ll show relevant case studies\b/gi, "show relevant case studies if available");
  text = text.replace(/\bwe will show relevant case studies\b/gi, "show relevant case studies if available");
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
  const reportTitle = isPro ? "Pro Conversion Audit Report" : "Basic Conversion Audit Report";

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
    throw new Error("You have reached the free diagnosis limit for today. Please try again tomorrow or unlock a paid solution from an existing diagnosis.");
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

function sanitizeSolutionMarkdown(text: string) {
  let output = text;

  const proof = "verified customer proof if available";
  const metric = "a verified performance result if available";
  const policy = "your actual support or refund policy if available";
  const price = "[your actual price]";

  // Remove invented brand/customer proof.
  output = output.replace(/\b(HubSpot|Mailchimp|Zapier|AdEspresso|Hootsuite|Salesforce|Slack|Notion|Stripe|Shopify)\b/gi, "verified customer");
  output = output.replace(/\btrusted by\s+\d+\+?[^.\n]*/gi, `trusted by ${proof}`);
  output = output.replace(/\bused by\s+[^.\n]*\d+\+?[^.\n]*/gi, `used by ${proof}`);
  output = output.replace(/\bclients include\b[^.\n]*/gi, `clients include ${proof}`);
  output = output.replace(/\blogos? of recognizable brands[^.\n]*/gi, proof);
  output = output.replace(/\bclient:\s*[^\n]+/gi, `Client: ${proof}`);
  output = output.replace(/\bcase study\b[^.\n]*(\d|%|x|revenue|signup|conversion|client)[^.\n]*/gi, `case study using ${metric}`);
  output = output.replace(/\bvideo case study\b/gi, "verified case study if available");

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
  output = output.replace(/\bspending at least\s+\[?your actual price\]?\s*k\/month[^.\n]*/gi, "with a clearly defined target customer if available");
  output = output.replace(/\b\d+%\\+? of visitors\b/gi, "many visitors");
  output = output.replace(/\bleak\s+\d+%\\+? of visitors\b/gi, "lose visitors before they convert");
  output = output.replace(/\bmore closed deals\b/gi, "more qualified conversion actions");
  output = output.replace(/\bfaster close rates\b/gi, "a clearer path to the next sales step");
  output = output.replace(/\bhigher revenue from the same traffic\b/gi, "better use of the same traffic");
  output = output.replace(/\bturns? ad traffic into booked calls and closed deals\b/gi, "helps more ad visitors take the next conversion step");
  output = output.replace(/\bturn your ad clicks into pipeline[^.\n]*/gi, "help more ad visitors take the next conversion step");
  output = output.replace(/\bYou your actual support or refund policy if available\b/gi, `Use ${policy}`);


  // Remove unsupported guarantees, refund terms, and free offers.
  output = output.replace(/\b(or it'?s free|or you do not pay|or you don't pay|you don’t pay|work for free until|first month free|pay only after|refund 100%|100% refund|100% satisfaction|money[- ]back guarantee|performance guarantee|results guaranteed in writing)\b[^.\n]*/gi, policy);
  output = output.replace(/\b\d{1,3}[- ]?day performance guarantee\b/gi, policy);
  output = output.replace(/\bif your conversion rate doesn[’']t improve[^.\n]*/gi, policy);
  output = output.replace(/\bif you don[’']t see[^.\n]*(increase|lift|boost|growth|improvement|result)[^.\n]*/gi, policy);

  // Remove unsupported pricing and invented package claims.
  output = output.replace(/\$\d[\d,]*(?:\.\d{2})?/g, price);
  output = output.replace(/\$X,XXX/g, price);
  output = output.replace(/\bone[- ]time landing page overhaul\s*[–-]\s*\[?your actual price\]?[^.\n]*/gi, `One-time landing page improvement package — ${price}`);
  output = output.replace(/\bmonthly retainer\b/gi, "ongoing support option if available");
  output = output.replace(/\bno long[- ]term contracts?\b/gi, "clear contract terms if available");
  output = output.replace(/\bcancel anytime\b/gi, "clear cancellation terms if available");

  // Remove fake founder/history claims in launch copy.
  output = output.replace(/\bI spent\s+\d+\s+years[^.\n]*/gi, "I have been reviewing common landing page conversion issues");
  output = output.replace(/\bwe spent\s+\d+\s+(weeks|months|years)[^.\n]*/gi, "We reviewed common landing page conversion issues");
  output = output.replace(/\bwe recently helped[^.\n]*/gi, `A useful example would show ${metric}`);
  output = output.replace(/\bwe did a full rewrite for[^.\n]*/gi, `A useful example would show ${metric}`);
  output = output.replace(/\bwent from\s+[^.\n]*(%|x|signup|conversion)[^.\n]*/gi, metric);

  // Tone down hype.
  output = output.replace(/\bclosing machine\b/gi, "clearer conversion path");
  output = output.replace(/\bproven copywriting\b/gi, "conversion-focused copywriting");
  output = output.replace(/\bbacked by real conversion data\b/gi, "validated with analytics if available");
  output = output.replace(/\bNo AI hype, just results\./gi, "Clear diagnosis and practical fixes.");
  // Tone down remaining unsupported proof/hype language.
  output = output.replace(/\bsales machine\b/gi, "clearer conversion path");
  output = output.replace(/\bproven system\b/gi, "structured conversion process");
  output = output.replace(/\bproven principles\b/gi, "conversion best practices");
  output = output.replace(/\bearly results from testers show positive direction[^.\n]*/gi, "early user feedback is welcome");
  output = output.replace(/\bwe[’']re not promising overnight miracles, but early user feedback is welcome\./gi, "We are looking for honest feedback from teams improving paid landing pages.");


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
Focus on score, executive summary, top conversion blockers, severity, and solution preview.
Do not reveal full hero rewrites, full CTA rewrites, pricing strategy, full FAQ, full hooks, or a complete 7-day implementation plan.
Keep paid-solution sections minimal or preview-level only.`;

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
        report: sanitizeSolutionMarkdown(rawText),
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
      report: sanitizeSolutionMarkdown(rawText),
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
          error: "Payment verification is required before generating a conversion solution."
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
