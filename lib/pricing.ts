import type { Tier } from "./types";

export const tiers: Record<Tier, { name: string; price: string; description: string; features: string[] }> = {
  basic: {
    name: "Basic Audit",
    price: "$9",
    description: "Best for quickly finding the biggest conversion blockers.",
    features: ["Conversion score", "Hero section diagnosis", "Headline/CTA rewrites", "5 action items"]
  },
  pro: {
    name: "Pro Audit",
    price: "$29",
    description: "Best for paid traffic, Shopify stores, SaaS pages, courses, and service funnels.",
    features: ["Full funnel diagnosis", "Buyer objections", "FAQ", "Ad hooks", "7-day optimization plan"]
  }
};
