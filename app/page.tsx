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
          <div className="brand"><span className="logo" />AI Conversion Clinic</div>
          <span className="badge">Conversion audit in minutes · PayPal checkout</span>
        </nav>

        <section className="grid">
          <div className="hero">
            <h1>Why are visitors not buying from your page?</h1>
            <p>Submit your landing page, Shopify store, SaaS page, course sales page, service page, or social profile. Get an actionable conversion audit with headline rewrites, value proposition fixes, CTA ideas, FAQ recommendations, and ad hooks.</p>

            <div className="cards">
              <div className="card"><strong>Hero Diagnosis</strong><span>See whether visitors can understand your value in the first 5 seconds.</span></div>
              <div className="card"><strong>Copy Rewrites</strong><span>Get replacement headlines, value propositions, and CTA copy you can use immediately.</span></div>
              <div className="card"><strong>Action Plan</strong><span>Follow a simple 7-day optimization plan instead of guessing what to change.</span></div>
            </div>

            <div className="steps">
              <div className="step">Submit your page and product details.</div>
              <div className="step">Pay with PayPal for the Basic or Pro audit.</div>
              <div className="step">Enter your PayPal email or transaction ID and generate the report.</div>
            </div>
          </div>

          <form className="panel" onSubmit={handleSubmit}>
            <div className="field">
              <label>Page URL</label>
              <input required type="url" placeholder="https://your-site.com" value={form.url} onChange={(e) => update("url", e.target.value)} />
            </div>

            <div className="field">
              <label>Product / service name</label>
              <input required placeholder="Example: Shopify pet store / AI resume tool / online course" value={form.product} onChange={(e) => update("product", e.target.value)} />
            </div>

            <div className="field">
              <label>Target customer</label>
              <input required placeholder="Example: US dog owners aged 25-40 / indie SaaS founders / career switchers" value={form.audience} onChange={(e) => update("audience", e.target.value)} />
            </div>

            <div className="field">
              <label>Main conversion problem</label>
              <input required placeholder="Example: traffic but no sales / expensive clicks / low demo bookings" value={form.problem} onChange={(e) => update("problem", e.target.value)} />
            </div>

            <div className="field">
              <label>Page copy or extra context, optional but recommended</label>
              <textarea placeholder="Paste your hero headline, benefits, pricing, FAQ, ad copy, or any important page text. The first version does not crawl websites automatically, so more context makes the audit more accurate." value={form.pageCopy} onChange={(e) => update("pageCopy", e.target.value)} />
            </div>

            <div className="field">
              <label>Email to receive the report</label>
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
            <p className="footer">Secure payment is handled through PayPal. After payment, enter your PayPal email or transaction ID to generate your report.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
