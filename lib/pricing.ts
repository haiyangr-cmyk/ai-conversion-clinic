import type { Tier } from "./types";

export const tiers: Record<Tier, { name: string; price: string; description: string; features: string[] }> = {
  basic: {
    name: "Conversion Solution",
    price: "$9",
    description: "Unlock copy-ready fixes for your biggest conversion blockers.",
    features: ["Conversion score", "Hero section diagnosis", "Headline/CTA rewrites", "5 action items"]
  },
  pro: {
    name: "Solution Pro",
    price: "$29",
    description: "Best for deeper fixes, launch follow-up copy, and a fuller action plan.",
    features: ["Full funnel diagnosis", "Buyer objections", "FAQ", "Ad hooks", "7-day optimization plan"]
  }
};
