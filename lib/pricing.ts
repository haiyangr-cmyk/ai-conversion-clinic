import type { Tier } from "./types";

export const tiers: Record<Tier, { name: string; price: string; description: string; features: string[] }> = {
  basic: {
    name: "基础诊断",
    price: "$9",
    description: "适合快速发现页面最大转化阻碍。",
    features: ["转化评分", "首屏问题", "标题/CTA 改写", "5 条执行建议"]
  },
  pro: {
    name: "深度诊断",
    price: "$29",
    description: "适合正在投流、卖课、独立站或 SaaS 页面。",
    features: ["完整漏斗诊断", "用户异议", "FAQ", "广告钩子", "7 天优化清单"]
  }
};
