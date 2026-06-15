import type { AuditInput } from "./types";

export function buildAuditPrompt(input: AuditInput) {
  const tierInstruction = input.tier === "pro"
    ? "Generate a Pro audit. Make it detailed, specific, and actionable. Include page structure recommendations, buyer objections, FAQ, ad/social hooks, and a 7-day optimization plan."
    : "Generate a Basic audit. Focus on the most important conversion blockers and provide immediately usable headline, value proposition, and CTA rewrites.";

  return `You are a senior conversion rate optimization consultant, growth strategist, and direct-response copywriter.

Create a client-ready conversion audit report for a landing page, Shopify store, SaaS page, course sales page, service page, or social profile.

Client input:
- Page URL: ${input.url}
- Product / service: ${input.product}
- Target customer: ${input.audience}
- Main conversion problem: ${input.problem}
- Page copy / extra context: ${input.pageCopy || "The user did not provide page copy. Base the audit on the product, target customer, and common conversion issues. Clearly state that this is a preliminary audit based on limited information."}
- Report tier: ${input.tier}

Requirements:
${tierInstruction}
- Write the entire report in English.
- Do not mention AI, models, prompts, or the generation process.
- Do not give generic advice. Every recommendation must explain exactly what to change.
- Explain why each recommendation can improve conversion.
- Do not promise a guaranteed conversion lift.
- Use clear, professional, plain English.
- Format the report in Markdown.

Use this exact structure:

# AI Conversion Audit Report

## 1. Overall Score
Give a 0-100 score and explain the reasoning in 2-3 sentences.

## 2. One-Sentence Diagnosis
Summarize the biggest conversion problem in one sentence.

## 3. Top 5 Conversion Leaks
For each leak, include: Problem, Impact, and Recommended Fix.

## 4. Hero Headline Rewrites
Provide 5 replacement headlines and explain when each one should be used.

## 5. Value Proposition Rewrites
Provide 5 sharper value propositions. Make each one concrete and outcome-oriented.

## 6. CTA Button Copy
Provide 5 CTA options and explain where each one should be used.

## 7. Buyer Objections
List the key reasons a visitor might not buy or convert, and explain how the page should address each one.

## 8. FAQ Recommendations
Provide FAQ copy that can be placed directly on the page.

## 9. Ad / Social Hook Ideas
Provide hooks that can be used in ads, X/Twitter posts, LinkedIn posts, short-form videos, or founder-led posts.

## 10. 7-Day Optimization Plan
Output Day 1 through Day 7. Each day must include one concrete action.`;
}


export function buildDiagnosisPrompt(input: AuditInput) {
  return `You are a senior conversion rate optimization consultant.

Generate a FREE conversion diagnosis for this page.

Client input:
- Page URL: ${input.url}
- Product / service: ${input.product}
- Target customer: ${input.audience}
- Main conversion problem: ${input.problem}
- Conversion goal: ${input.conversionGoal || "not specified"}
- Page copy / extra context: ${input.pageCopy || "Not provided"}

Rules:
- Write in English.
- Do not provide the full solution.
- Do not provide full hero rewrites, full CTA rewrites, pricing strategy, or 7-day plan.
- Focus only on diagnosis: score, top blockers, severity, and why they hurt conversion.
- End with a short solution preview that makes the paid fix plan valuable.
- Do not promise guaranteed results.
- Format in Markdown.

Use this structure:

# Free Conversion Diagnosis

## Conversion Score
Give a 0-100 score.

## One-Sentence Diagnosis
Summarize the main conversion problem.

## Top 3 Conversion Blockers
For each blocker include:
- Severity
- Why it hurts conversion
- What area needs attention

## Solution Preview
Briefly explain what the full paid Conversion Solution would include.`;
}

export function buildSolutionPrompt(input: AuditInput) {
  const isPro = input.tier === "pro";
  const tierName = isPro ? "Pro Conversion Solution" : "Basic Conversion Solution";

  const tierInstruction = isPro
    ? `This is the $29 Pro Conversion Solution.
Make it substantially deeper than Basic.
Include multiple variants, page-structure guidance, objection handling, A/B test guidance, launch follow-up copy variants, and a 14-day follow-up checklist.
Do not include human review, dashboard features, account features, or manual consulting promises.`
    : `This is the $9 Basic Conversion Solution.
Keep it concise and focused on the highest-leverage fixes.
Include one strong recommendation per section, not multiple large variant sets.
Do not include Pro-only sections such as headline variants, CTA variants, section-by-section rewrite, FAQ bank, A/B testing plan, or 14-day follow-up checklist.`;

  const structure = isPro
    ? `# Pro Conversion Solution

## Recommended Positioning

## Hero Rewrite

## Hero Variants

## CTA Fixes

## CTA Variants

## Section-by-Section Page Rewrite

## Trust & Proof Plan

## Pricing / Offer Variants

## Objection Handling / FAQ

## A/B Testing Plan

## 7-Day Implementation Plan

## 14-Day Follow-up Checklist

## Product Hunt Launch Copy

## Reddit Post & Comment Variants

## Important Note
Recommendations should be validated with analytics, customer feedback, and A/B testing.`
    : `# Basic Conversion Solution

## Recommended Positioning

## Hero Rewrite

## CTA Fixes

## Trust & Proof Fixes

## Pricing / Offer Fixes

## 7-Day Action Plan

## Product Hunt / Reddit Follow-up Copy

## Important Note
Recommendations should be validated with analytics, customer feedback, and A/B testing.`;

  return `You are a senior conversion rate optimization consultant, growth strategist, and direct-response copywriter.

Generate a PAID ${tierName} for this page.

Client input:
- Page URL: ${input.url}
- Product / service: ${input.product}
- Target customer: ${input.audience}
- Main conversion problem: ${input.problem}
- Conversion goal: ${input.conversionGoal || "not specified"}
- Page copy / extra context: ${input.pageCopy || "Not provided"}
- Tier: ${input.tier} (${tierName})

Tier instructions:
${tierInstruction}

Rules:
- Write in English.
- Make every recommendation specific, practical, and copy-ready.
- Do not give generic advice.
- Do not promise guaranteed results.
- Do not mention AI, models, prompts, or the generation process.
- Format in Markdown.
- Match the exact tier structure below.
- Do not include Pro-only sections in the Basic solution.
- Do not make Basic and Pro look like the same product.

Hard safety rules:
- Do not invent customer names, company logos, testimonials, case studies, traffic numbers, revenue numbers, conversion rates, ratings, follower counts, or performance results.
- Do not mention specific companies such as HubSpot, Mailchimp, Zapier, AdEspresso, Hootsuite, or any other brand unless the user provided them.
- Do not recommend guarantees such as "double signups", "or it is free", "20% lift", "4x growth", "refund 100%", or "work for free until results" unless the user explicitly provided that policy.
- Do not invent exact pricing, package names, refund terms, timelines, or legal guarantees.
- When proof is missing, write "verified customer proof if available", "measured result if available", or "case study if available".
- When analytics are missing, state that recommendations are hypotheses to validate with analytics and customer feedback.
- Do not write as if you are the business owner. Avoid unsupported first-person claims such as "we helped", "our clients", or "we guarantee".
- Keep all examples clearly generic and non-factual unless supplied by the user.
- Do not create aggressive guarantee-based copy such as "or you do not pay", "or it is free", "first month free", "pay only after delivery", "100% refund", "work for free", or "performance guarantee".
- Do not create exact lift promises or ranges such as "20-40% better", "double signups", "4x growth", or "10% lift".
- Do not invent time-bound delivery promises such as "in 7 days we transform your page" unless the user explicitly provided that service promise.
- Do not invent business history such as "I spent 4 years", "we helped a SaaS client", or "we built this after working with X clients".
- Do not recommend fake trust bars, fake logo rows, fake client counts, or fake case studies.
- If a section needs proof, write: "Add verified customer proof if available."
- If a section needs a guarantee/refund/support policy, write: "Add your actual support or refund policy if available."
- If a section needs pricing, write: "[your actual price]" and do not invent a price tier.
- Product Hunt / Reddit copy must be honest, modest, and based only on the product's actual value proposition.
- Do not change the user's business model, pricing model, payment terms, guarantee policy, refund policy, contract terms, or service scope.
- Do not recommend performance-based pricing, "pay only if results improve", "no upfront payment", "charge only when it wins", or similar commercial terms unless the user explicitly provided that model.
- Do not claim the business gets more closed deals, higher revenue, or better close rates. You may frame these as desired outcomes only, not promises.
- Do not invent qualification rules such as minimum ad spend, minimum company size, or target budget.
- Do not use statistics like "90% of visitors leak" unless supplied by the user.
- Recommend wording changes, structure changes, proof placement, CTA clarity, and validation steps. Do not invent business policies.

Use this exact structure:

${structure}`;
}

