"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { tiers } from "../lib/pricing";
import type { AuditInput, Tier } from "../lib/types";

const initialForm: AuditInput = {
  url: "",
  product: "",
  audience: "",
  problem: "",
  pageCopy: "",
  email: "",
  tier: "basic"
};

export default function HomePage() {
  const router = useRouter();
  const [form, setForm] = useState<AuditInput>(initialForm);

  function update<K extends keyof AuditInput>(key: K, value: AuditInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem("audit-input", JSON.stringify(form));
    router.push("/checkout");
  }

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><span className="logo" />AI 转化率急诊室</div>
          <span className="badge">3 分钟生成报告 · PayPal 收款版</span>
        </nav>

        <section className="grid">
          <div className="hero">
            <h1>你的页面为什么有人看，却没人买？</h1>
            <p>输入落地页、Shopify 店铺、SaaS 页面、课程销售页或社媒主页信息，AI 会生成一份可执行的转化率诊断报告，告诉你标题、卖点、CTA、FAQ 和广告钩子应该怎么改。</p>

            <div className="cards">
              <div className="card"><strong>首屏诊断</strong><span>判断用户 5 秒内是否能理解价值。</span></div>
              <div className="card"><strong>文案重写</strong><span>直接给出标题、卖点和 CTA 替换稿。</span></div>
              <div className="card"><strong>执行清单</strong><span>给你未来 7 天可以照做的优化动作。</span></div>
            </div>

            <div className="steps">
              <div className="step">提交页面和产品信息。</div>
              <div className="step">通过 PayPal 支付基础版或深度版。</div>
              <div className="step">输入 PayPal 邮箱/交易号，生成诊断报告。</div>
            </div>
          </div>

          <form className="panel" onSubmit={handleSubmit}>
            <div className="field">
              <label>页面链接</label>
              <input required type="url" placeholder="https://your-site.com" value={form.url} onChange={(e) => update("url", e.target.value)} />
            </div>

            <div className="field">
              <label>产品/服务名称</label>
              <input required placeholder="例如：Shopify 宠物用品店 / AI 简历工具 / 线上课程" value={form.product} onChange={(e) => update("product", e.target.value)} />
            </div>

            <div className="field">
              <label>目标客户</label>
              <input required placeholder="例如：美国 25-40 岁养狗人群 / 想转码的留学生" value={form.audience} onChange={(e) => update("audience", e.target.value)} />
            </div>

            <div className="field">
              <label>当前最大问题</label>
              <input required placeholder="例如：有点击但没有购买 / 广告点击贵 / 咨询少" value={form.problem} onChange={(e) => update("problem", e.target.value)} />
            </div>

            <div className="field">
              <label>页面文案或补充信息，可选但强烈建议填写</label>
              <textarea placeholder="粘贴首屏标题、卖点、价格、FAQ、广告文案等。第一版不自动爬网页，粘贴越多，报告越准。" value={form.pageCopy} onChange={(e) => update("pageCopy", e.target.value)} />
            </div>

            <div className="field">
              <label>接收报告的邮箱</label>
              <input required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>

            <div className="field">
              <label>选择报告版本</label>
              <div className="price-grid">
                {(Object.keys(tiers) as Tier[]).map((tier) => (
                  <button
                    type="button"
                    key={tier}
                    className={`price-card ${form.tier === tier ? "active" : ""}`}
                    onClick={() => update("tier", tier)}
                  >
                    <strong>{tiers[tier].name}</strong>
                    <div className="price">{tiers[tier].price}</div>
                    <span className="muted">{tiers[tier].description}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="cta" type="submit">继续付款</button>
            <p className="footer">提示：这是第一天 MVP。PayPal 付款采用链接/按钮方式，付款验证可先人工抽查。</p>
          </form>
        </section>
      </div>
    </main>
  );
}
