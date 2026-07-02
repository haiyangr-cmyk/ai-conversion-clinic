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
- Do not provide the full paid fix plan.

CRITICAL PAID REPORT QUALITY RULES:
- Never output placeholders such as [your actual price], [price], [customer name], [company], [X], or availability placeholders.
- Always use the actual selected product name and price when available: Quick Fix Report ($9) or Pro Fix Plan ($29).
- Do not mention password-protected PDF delivery, email delivery within 5 minutes, or any delivery flow that is not part of the actual product.
- The real flow is: PayPal payment confirmed, user returns to checkout, user generates the full fix plan, user views/copies/exports the report.
- Do not invent testimonials, customer counts, partner logos, revenue claims, guarantees, countdown timers, scarcity, or verified customer proof.
- Do not recommend fake Reddit comments, alt accounts, fake user testimonials, or deceptive Product Hunt / Reddit promotion.
- Do not say "inferred", "assume the page currently has", or expose uncertainty in the final paid report. If page details are limited, state the limitation clearly and give practical recommendations based on the provided input.
- Avoid broken special characters, decorative symbols, checkmark glyphs, or arrows that may export badly to PDF. Use plain bullets and numbered lists only.
- Avoid recommending tools that no longer exist or are deprecated. Do not recommend Google Optimize.
- Keep the report specific to the user's page URL, product/service, target customer, conversion goal, and stated conversion problem.
- The Pro Fix Plan must feel more valuable than the free diagnosis: include prioritization, concrete rewrites, objection handling, trust/payment reassurance, and implementation steps.

- Do not provide full hero rewrites, full CTA rewrites, pricing strategy, or 7-day plan.
- Focus only on diagnosis: score, top blockers, severity, and why they hurt conversion.
- End with a short fix plan preview that makes the paid fix plan valuable.
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
Briefly explain what the full paid fix plan would include.`;
}

export function buildSolutionPrompt(input: AuditInput) {
  const isPro = input.tier === "pro";
  const tierName = isPro ? "Pro Fix Plan" : "Quick Fix Report";
  const paidReportHardContract = isPro
    ? `
PAID REPORT HARD CONTRACT:
- Use exact product names and prices only: Free Diagnosis, Quick Fix Report ($9), Pro Fix Plan ($29).
- When comparing paid tiers, write "the $9 Quick Fix Report and the $29 Pro Fix Plan".
- Never write "$29 version", "$29 tier", "$29 vs $29", "$9 Pro", or "$29 Quick Fix".
- Do not mention immediately, instant, instantly, in X minutes, within X hours, no waiting, no additional steps, delivered within, receive a link, or email delivery.
- Use this exact delivery wording whenever needed: "After payment confirmation, the user can generate, view, copy, or export the full fix plan."
- Do not mention account pages, saved accounts, stored reports, sign-up, pre-filled email, or revisit-at-any-time features.
- Do not promise 30-day refunds, full refunds, satisfaction refunds, guarantees, no-questions-asked refunds, or support windows. You may only say: "Link to the published refund/support policy."
- Do not invent customer proof, verified customers, PayPal Verified status, logos, usage counts, testimonials, proven results, protected-by-PayPal claims, or real customer examples.
- Do not say real sample, real example, previous customer, similar client page, real content, or actual recommendation. Use "sample" or "anonymized sample" only.
- Do not use exact capability counts unless provided by the site context. Avoid 5+, 6+, 10+, 15+, 20+, 30+, 40+, 3-5, 8-12, and 12-15.
- Do not include Product Hunt, Reddit, launch copy, community posts, email follow-up sequences, re-engagement emails, scarcity, coupon, discount, countdown, first 50/100, or price-increase tactics.
- Do not use likely, assumed, hypothesized, estimated, current from context, Current (assumed), Current (inferred), or placeholder brackets.
- Do not use checkmark/cross symbols. Use Yes, No, or Limited.
- Before returning the report, silently scan for all forbidden terms above and rewrite them using allowed neutral wording. Do not mention this scan.
`
    : "";


  const tierInstruction = isPro
    ? `This is the $29 Pro Fix Plan.
Make it substantially deeper than the $9 Quick Fix Report.
Focus only on paid conversion diagnosis, prioritized fixes, copy rewrites, CTA/checkout improvements, trust reassurance, objection handling, and implementation guidance.
Do not include launch follow-up copy, email follow-up sequences, re-engagement email sequences, Product Hunt copy, Reddit copy, offer variants, scarcity tactics, fake urgency, fake guarantees, customer proof placeholders, or promotional scripts.
Use exact product pricing only: Quick Fix Report is $9. Pro Fix Plan is $29. Never describe Quick Fix Report as $29. Never write "$29 and $29", "$29 or $29", or "price difference between $29 and $29". When comparing tiers, write "$9 Quick Fix Report and $29 Pro Fix Plan".
Do not include expiry windows, saved-for-X-days claims, limited availability, countdowns, first 50, first 100, price increases, discount windows, launch-week pricing, or generated-plan expiration unless explicitly provided by the business.
Do not use "likely", "assumed", "hypothesized", "estimated", or "current likely" in the final report.
Do not say "instant download", "instantly downloadable", or "instant access". Use: "After payment confirmation, the user can generate, view, copy, or export the full fix plan."
Do not use checkmark or cross symbols in tables. Use plain text: Yes / No / Limited.
Do not include human review, dashboard features, account features, or manual consulting promises.`
    : `This is the $9 Quick Fix Report.
Keep it concise and focused on the highest-leverage fixes.
Include one strong recommendation per section, not multiple large variant sets.
Do not include Pro-only sections such as headline variants, CTA variants, section-by-section rewrite, FAQ bank, A/B testing plan, or 14-day follow-up checklist.`;

  const structure = isPro
    ? `# Pro Fix Plan

## Executive Diagnosis
Write one clear paragraph explaining the main paid-conversion problem on this page.
Focus on why a visitor who completes the free diagnosis may not upgrade to the Pro Fix Plan.
Do not use hypothetical, estimated, current likely, or assumed wording.

## Conversion Score Breakdown
Score each item from 1 to 10:
- Offer clarity
- Paid plan perceived value
- CTA strength
- Trust and payment reassurance
- Objection handling
- Checkout readiness

For each score, include:
- Score
- Evidence from the submitted page context
- One specific fix

## Top 3 Paid Conversion Leaks
For each leak, include:
- Leak name
- Why it hurts paid conversion
- What to change
- Priority: High / Medium / Low
- Validation metric

## Priority Fix Roadmap
Give the first 3 fixes to implement in order.
For each fix, include:
- Page location
- Implementation effort
- Expected impact level
- Exact copy or UI change

## Hero & Above-the-Fold Rewrite
Provide:
- Recommended headline
- Recommended subheadline
- Primary CTA
- CTA microcopy
- Two alternate headline variants

Use only truthful copy. Do not include fake urgency, fake scarcity, fake proof, unsupported statistics, or performance promises.

## CTA & Checkout Unlock Fixes
Focus on the free diagnosis result page and checkout path.
Include:
- Primary unlock CTA
- Secondary reassurance line
- Button text
- What the user sees after clicking
- What happens after payment

Use the real product flow:
Payment is confirmed, then the user generates and views the full fix plan, and can copy or export the report.

## Trust & Payment Reassurance
Recommend only truthful trust elements:
- Secure PayPal checkout
- One-time payment
- Published refund/support policy link
- Sample report link
- Clear what-happens-after-payment explanation

Do not invent testimonials, customer counts, logos, guarantees, countdowns, expiry windows, delivery times, or scarcity.

## Objection Handling FAQ
Write answers for these 5 objections:
1. Why pay after the free diagnosis?
2. How is Pro different from Quick Fix Report?
3. Is this specific to my page?
4. What if I am not technical?
5. What happens after payment?

Answers must be accurate. Refer only to the published refund/support policy. Do not invent guarantees.

## A/B Testing Plan
Provide exactly 3 tests:
1. CTA copy test
2. Paid value preview test
3. Checkout reassurance test

For each test include:
- Hypothesis
- Control
- Variant
- Metric
- Minimum data note

Do not require unrealistic sample sizes. Do not promise statistical significance.

## 7-Day Implementation Plan
Give one practical action per day for improving paid conversion.

## 14-Day Follow-up Checklist
Give a concise checklist for measuring and iterating the paid conversion funnel.

## Important Note
State that all recommendations are hypotheses to validate with analytics and customer feedback.
Do not claim guaranteed improvement.`
    : `# Quick Fix Report







## Trust & Proof Fixes

## Pricing / Offer Fixes

## 7-Day Action Plan


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
${paidReportHardContract}

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
- When proof is missing, do not invent it. Say that real proof should be added only when it exists.
- When analytics are missing, state that recommendations are hypotheses to validate with analytics and customer feedback.
- Do not write as if you are the business owner. Avoid unsupported first-person claims such as "we helped", "our clients", or "we guarantee".
- Keep all examples clearly generic and non-factual unless supplied by the user.
- Do not create aggressive guarantee-based copy such as "or you do not pay", "or it is free", "first month free", "pay only after delivery", "100% refund", "work for free", or "performance guarantee".
- Do not create exact lift promises or ranges such as "20-40% better", "double signups", "4x growth", or "10% lift".
- Do not invent time-bound delivery promises such as "in 7 days we transform your page" unless the user explicitly provided that service promise.
- Do not invent business history such as "I spent 4 years", "we helped a SaaS client", or "we built this after working with X clients".
- Do not recommend fake trust bars, fake logo rows, fake client counts, or fake case studies.
- If a section needs proof, write: "Add verified customer proof only when you have it."
- If a section needs a guarantee/refund/support policy, refer only to the published support or refund policy.
- If a section needs pricing, use the actual selected plan name and price when available. If the price is unavailable, omit the price instead of using placeholders.
- Do not include Product Hunt, Reddit, promotional comments, maker comments, or launch copy in the paid report unless the user explicitly asks for promotional assets.
- Do not change the user's business model, pricing model, payment terms, guarantee policy, refund policy, contract terms, or service scope.
- Do not recommend performance-based pricing, "pay only if results improve", "no upfront payment", "charge only when it wins", or similar commercial terms unless the user explicitly provided that model.
- Do not claim the business gets more closed deals, higher revenue, or better close rates. You may frame these as desired outcomes only, not promises.
- Do not invent qualification rules such as minimum ad spend, minimum company size, or target budget.
- Do not use statistics like "90% of visitors leak" unless supplied by the user.
- Recommend wording changes, structure changes, proof placement, CTA clarity, and validation steps. Do not invent business policies.

Use this exact structure:

${structure}`;
}
