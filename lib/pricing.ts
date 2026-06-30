import type { Tier } from "./types";

export const tiers: Record<Tier, { name: string; price: string; description: string; features: string[] }> = {
  basic: {
    name: "Quick Fix Report",
    price: "$9",
    description: "Core copy-ready fixes for the biggest blockers found in your free diagnosis.",
    features: [
      "Recommended positioning",
      "Hero rewrite",
      "CTA fixes",
      "Trust and proof fixes",
      "Pricing / offer fixes",
      "7-day action plan",
      "1 Product Hunt / Reddit follow-up copy"
    ]
  },
  pro: {
    name: "Pro Fix Plan",
    price: "$29",
    description: "Expanded fix plan with variants, page structure, objections, testing, and launch copy.",
    features: [
      "Everything in Quick Fix Report",
      "3 hero headline variants",
      "3 CTA variants",
      "Section-by-section rewrite plan",
      "Objection / FAQ fixes",
      "A/B testing plan",
      "Product Hunt + Reddit copy variants",
      "14-day follow-up checklist"
    ]
  }
};
