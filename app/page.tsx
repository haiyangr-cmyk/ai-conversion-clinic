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

const useCases = [
  {
    title: "Shopify stores",
    text: "For stores with traffic, product views, or add-to-carts, but weak sales."
  },
  {
    title: "SaaS pages",
    text: "For pages with low trial signups, low demo bookings, or unclear positioning."
  },
  {
    title: "Sales pages",
    text: "For course, coaching, consulting, agency, and service pages that need stronger messaging."
  },
  {
    title: "Ad landing pages",
    text: "For founders and marketers who want to find obvious leaks before spending more on ads."
  }
];

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
          <div className="brand"><img className="brand-logo" src="/logo.jpeg" alt="AI Conversion Clinic logo" />AI Conversion Clinic</div>
          <span className="badge">Conversion audit in minutes · PayPal checkout</span>
        </nav>

        <section className="grid">
          <div className="hero">
            <div className="eyebrow">AI-powered landing page audit</div>
            <h1>Why are visitors not buying from your page?</h1>
            <p>
              Submit your landing page, Shopify store, SaaS page, course sales page, service page,
              or sales page. Get an actionable conversion audit with headline rewrites, CTA ideas,
              buyer objections, FAQ recommendations, ad/social hooks, and a 7-day optimization plan.
            </p>

            <div className="hero-actions">
              <a className="mini-cta" href="#audit-form">Start audit</a>
              <a className="mini-cta secondary" href="#sample-report">View sample report</a>
            </div>

            <div className="cards">
              <div className="card"><strong>Hero Diagnosis</strong><span>Check whether visitors understand your value in the first 5 seconds.</span></div>
              <div className="card"><strong>Copy Rewrites</strong><span>Get headline, value proposition, CTA, and objection-handling ideas.</span></div>
              <div className="card"><strong>Action Plan</strong><span>Receive a prioritized 7-day plan you can execute step by step.</span></div>
            </div>

            <div className="steps">
              <div className="step">Submit your page URL, product, audience, and conversion problem.</div>
              <div className="step">Choose Basic or Pro and complete secure PayPal checkout.</div>
              <div className="step">Get your AI-generated conversion audit after payment confirmation.</div>
            </div>
          </div>

          <form id="audit-form" className="panel" onSubmit={handleSubmit}>
            <div className="field">
              <label>Page URL</label>
              <input required type="url" placeholder="https://your-site.com" value={form.url} onChange={(e) => update("url", e.target.value)} />
            </div>

            <div className="field">
              <label>Product / service</label>
              <input required placeholder="Shopify pet store / AI SaaS / online course" value={form.product} onChange={(e) => update("product", e.target.value)} />
            </div>

            <div className="field">
              <label>Target customer</label>
              <input required placeholder="Active dog owners, SaaS founders, coaches, consultants" value={form.audience} onChange={(e) => update("audience", e.target.value)} />
            </div>

            <div className="field">
              <label>Main conversion problem</label>
              <input required placeholder="Traffic but no sales / low demo bookings / low signup rate" value={form.problem} onChange={(e) => update("problem", e.target.value)} />
            </div>

            <div className="field">
              <label>Page copy or extra context</label>
              <textarea placeholder="Paste your hero headline, value proposition, pricing, FAQ, ad copy, or any page context. The more context you provide, the better the audit." value={form.pageCopy} onChange={(e) => update("pageCopy", e.target.value)} />
            </div>

            <div className="field">
              <label>Email</label>
              <input required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>

            <div className="field">
              <label>Choose your report</label>
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

            <button className="cta" type="submit">Continue to payment</button>
            <p className="footer">Secure PayPal checkout · Report generated after payment confirmation</p>
          </form>
        </section>

        <section id="sample-report" className="section">
          <div className="section-heading">
            <span className="eyebrow">Sample report preview</span>
            <h2>What you get after checkout</h2>
            <p>
              The report is designed to give practical direction, not generic website feedback.
              Here is a shortened example based on a fictional Shopify store.
            </p>
          </div>

          <div className="sample-report">
            <div className="score-card">
              <span>Overall Score</span>
              <strong>68 / 100</strong>
              <p>Fictional Shopify example: waterproof dog collars for active outdoor dogs.</p>
            </div>

            <div className="report-grid">
              <div className="report-item">
                <strong>One-Sentence Diagnosis</strong>
                <p>The page explains the product, but it does not make the buyer outcome, trust proof, and next step clear enough in the first 5 seconds.</p>
              </div>
              <div className="report-item">
                <strong>Top Conversion Leak</strong>
                <p>The headline is too generic. “Durable dog collars” sounds like a category, not a reason to buy.</p>
              </div>
              <div className="report-item">
                <strong>Headline Rewrite</strong>
                <p><b>Before:</b> Durable Dog Collars for Every Adventure<br /><b>After:</b> Waterproof dog collars for active dogs who hike, swim, and roll in everything.</p>
              </div>
              <div className="report-item">
                <strong>CTA Improvement</strong>
                <p>Test “Find the right collar for my dog” instead of a generic “Shop Now” CTA.</p>
              </div>
            </div>

            <div className="plan-strip">
              7-Day Plan: rewrite hero · move proof near CTA · clarify shipping/returns · add FAQ · test headline variations
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <span className="eyebrow">Who is this for?</span>
            <h2>Best for pages that already get some traffic</h2>
            <p>
              AI Conversion Clinic works best when you already have a page, offer, or funnel
              and need a clearer diagnosis before spending more on ads, design, or tools.
            </p>
          </div>

          <div className="use-case-grid">
            {useCases.map((item) => (
              <div className="use-case-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section disclaimer-section">
          <div className="notice">
            <strong>Important note:</strong> This audit provides actionable recommendations, but it does not guarantee a specific conversion rate increase.
            Results depend on traffic quality, offer strength, implementation, and testing.
          </div>
        </section>
      </div>
    </main>
  );
}
