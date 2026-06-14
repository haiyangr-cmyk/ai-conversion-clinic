import { NextRequest } from "next/server";
import type { AuditInput } from "../../../lib/types";
import { buildAuditPrompt } from "../../../lib/prompt";
import { verifyPaymentToken } from "../../../lib/payment-token";
import {
  buildAuditPromptV2,
  isValidAuditReportV2,
  parseAuditReportV2,
  type AuditReportV2
} from "../../../lib/report-v2";

export const runtime = "nodejs";

function validateInput(input: Partial<AuditInput>) {
  const required: Array<keyof AuditInput> = ["url", "product", "audience", "problem", "email", "tier"];
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


function formatReportV2AsText(report: AuditReportV2) {
  const lines: string[] = [];

  lines.push("# Conversion Audit Report");
  lines.push("");
  lines.push(`Overall Score: ${report.executiveSummary.overallScore}/100`);
  lines.push(`Page Type: ${report.meta.pageType}`);
  lines.push("");
  lines.push("## Executive Summary");
  lines.push(report.executiveSummary.oneSentenceDiagnosis);
  lines.push("");
  lines.push(`Biggest Opportunity: ${report.executiveSummary.biggestOpportunity}`);
  lines.push(`Primary Action: ${report.executiveSummary.primaryAction}`);
  lines.push("");
  lines.push("## Score Breakdown");
  for (const item of report.scoreBreakdown) {
    lines.push(`- ${item.label}: ${item.score}/100 — ${item.reason}`);
  }
  lines.push("");
  lines.push("## Top Conversion Leaks");
  for (const leak of report.topLeaks) {
    lines.push(`- ${leak.title} (${leak.impact} impact): ${leak.whatToChange}`);
  }
  lines.push("");
  lines.push("## 7-Day Action Plan");
  for (const day of report.sevenDayPlan) {
    lines.push(`Day ${day.day}: ${day.title} — ${day.action}`);
  }

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
      return {
        report: formatReportV2AsText(sanitizedReportV2),
        reportV2: sanitizedReportV2
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

async function generateWithAI(input: AuditInput) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!deepseekKey && !openaiKey) {
    const reportV2 = demoReportV2(input);
    return {
      report: formatReportV2AsText(reportV2) || demoReport(input),
      reportV2,
      demo: true
    };
  }

  const prompt = buildAuditPromptV2(input);
  const fallbackPrompt = buildAuditPrompt(input);
  const temperature = 0.35;
  const maxTokens = input.tier === "pro" ? 9000 : 5500;

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
            content: "You are a senior CRO consultant. Return valid JSON only. Do not include Markdown or code fences."
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

    const parsed = parseModelReport(rawText, input);

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
          max_tokens: input.tier === "pro" ? 4200 : 2800,
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

  const parsed = parseModelReport(rawText, input);
  return { ...parsed, demo: false };
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as AuditInput;
    const error = validateInput(input);
    if (error) return Response.json({ ok: false, error }, { status: 400 });

    const devSkipPayment = process.env.NODE_ENV === "development" && process.env.DEV_SKIP_PAYMENT === "true";
    const paymentRequired = !devSkipPayment && Boolean(process.env.PAYPAL_CLIENT_SECRET && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
    if (paymentRequired) {
      if (!input.paymentToken) {
        return Response.json({
          ok: false,
          error: "Payment verification is required before generating a report."
        }, { status: 402 });
      }

      verifyPaymentToken(input.paymentToken, input.tier);
    }

    console.log("NEW_AUDIT_ORDER", {
      email: input.email,
      paypalEmail: input.paypalEmail,
      paypalTransactionId: input.paypalTransactionId,
      paypalOrderId: input.paypalOrderId,
      tier: input.tier,
      url: input.url,
      createdAt: new Date().toISOString()
    });

    const { report, reportV2, demo } = await generateWithAI(input);
    await sendLeadWebhook(input, report);

    return Response.json({ ok: true, report, reportV2, demo });
  } catch (error) {
    console.error("GENERATE_REPORT_ERROR", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Report generation failed" }, { status: 500 });
  }
}
