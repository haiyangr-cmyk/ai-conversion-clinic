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
    title: "Hero Diagnosis",
    text: "Check whether visitors understand your value in the first 5 seconds."
  },
  {
    title: "Copy Rewrites",
    text: "Get headline, value proposition, CTA, and objection-handling ideas."
  },
  {
    title: "Action Plan",
    text: "Receive a prioritized 7-day plan you can execute step by step."
  }
];


const productSuggestions = [
  "Ad landing page for a paid campaign",
  "Agency or consulting service page",
  "AI SaaS landing page",
  "App landing page",
  "Coaching or creator offer",
  "Ecommerce product page",
  "Local service business page",
  "Mobile app landing page",
  "Newsletter or community page",
  "Online course sales page",
  "SaaS pricing page",
  "Shopify store selling physical products"
].sort((a, b) => a.localeCompare(b));

const audienceSuggestions = [
  "B2B SaaS buyers",
  "B2B SaaS founders",
  "Coaches and consultants",
  "Course creators",
  "Ecommerce shoppers",
  "Enterprise buyers",
  "Local business customers",
  "Mobile app users",
  "Newsletter subscribers",
  "Paid ad visitors",
  "Sales teams",
  "Shopify store owners"
].sort((a, b) => a.localeCompare(b));

const problemSuggestions = [
  "High cart abandonment",
  "High bounce rate",
  "Low add-to-cart rate",
  "Low checkout completion",
  "Low demo bookings",
  "Low email signups",
  "Low free trial signups",
  "Low lead form submissions",
  "Low purchase conversion",
  "Low signup rate",
  "Traffic but no sales",
  "Visitors leave without clicking the CTA"
].sort((a, b) => a.localeCompare(b));

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
            <h1>Find out why your landing page isn’t converting.</h1>
            <p>AI Conversion Clinic diagnoses your landing page, identifies the biggest conversion blockers, and generates a practical fix plan you can ship this week.</p>

            <div className="hero-actions">
              <a className="mini-cta" href="#audit-form">Start audit</a>
              <a className="mini-cta secondary" href="#sample-report">See Example Diagnosis</a>
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
              <label>Page URL <span className="required-mark">*</span></label>
              <input required type="url" placeholder="https://your-site.com" value={form.url} onChange={(e) => update("url", e.target.value)} />
            </div>

            <div className="field compact-suggest-field">
              <label>Product / service <span className="required-mark">*</span></label>
              <div className="compact-combo">
                <input
                  required
                  placeholder="Example: Shopify store / SaaS / course page"
                  value={form.product}
                  onChange={(e) => update("product", e.target.value)}
                />

                <details
                  className="compact-dropdown"
                  onBlur={(e) => {
                    const nextFocus = e.relatedTarget as Node | null;

                    if (!nextFocus || !e.currentTarget.contains(nextFocus)) {
                      e.currentTarget.removeAttribute("open");
                    }
                  }}
                >
                  <summary aria-label="Show product suggestions">▾</summary>
                  <div className="compact-dropdown-menu">
                    {productSuggestions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          update("product", option);
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            update("product", option);
                            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                          }
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            <div className="field compact-suggest-field">
              <label>Target customer <span className="required-mark">*</span></label>
              <div className="compact-combo">
                <input
                  required
                  placeholder="Example: US dog owners / SaaS founders / sales teams"
                  value={form.audience}
                  onChange={(e) => update("audience", e.target.value)}
                />

                <details
                  className="compact-dropdown"
                  onBlur={(e) => {
                    const nextFocus = e.relatedTarget as Node | null;

                    if (!nextFocus || !e.currentTarget.contains(nextFocus)) {
                      e.currentTarget.removeAttribute("open");
                    }
                  }}
                >
                  <summary aria-label="Show audience suggestions">▾</summary>
                  <div className="compact-dropdown-menu">
                    {audienceSuggestions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          update("audience", option);
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            update("audience", option);
                            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                          }
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            <div className="field compact-suggest-field">
              <label>Main conversion problem <span className="required-mark">*</span></label>
              <div className="compact-combo">
                <input
                  required
                  placeholder="Example: Traffic but no sales / low signups"
                  value={form.problem}
                  onChange={(e) => update("problem", e.target.value)}
                />

                <details
                  className="compact-dropdown"
                  onBlur={(e) => {
                    const nextFocus = e.relatedTarget as Node | null;

                    if (!nextFocus || !e.currentTarget.contains(nextFocus)) {
                      e.currentTarget.removeAttribute("open");
                    }
                  }}
                >
                  <summary aria-label="Show problem suggestions">▾</summary>
                  <div className="compact-dropdown-menu">
                    {problemSuggestions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          update("problem", option);
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            update("problem", option);
                            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                          }
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            <div className="field">
              <label>Page copy or extra context</label>
              <textarea placeholder="Paste your hero headline, value proposition, pricing, FAQ, ad copy, or any page context. The more context you provide, the better the audit." value={form.pageCopy} onChange={(e) => update("pageCopy", e.target.value)} />
            </div>

            <div className="field">
              <label>Email</label>
              <p className="field-help">Used only for payment support or report recovery.</p>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
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
            <span className="eyebrow">Example Diagnosis preview</span>
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

        <section className="section comparison-section" id="compare-plans">
          <div className="section-heading compact">
            <span className="eyebrow">Basic vs Pro</span>
            <h2>Choose the depth you need</h2>
            <p>
              Basic gives you a quick diagnosis. Pro gives you a fuller action plan for pages with traffic,
              paid campaigns, or a real offer you want to improve.
            </p>
          </div>

          <div className="compare-table" role="table" aria-label="Basic and Pro audit comparison">
            <div className="compare-row compare-head" role="row">
              <div role="columnheader">What you get</div>
              <div role="columnheader">Conversion Solution · $9</div>
              <div role="columnheader">Solution Pro · $29</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Best for</div>
              <div role="cell">A quick first check before making obvious page fixes.</div>
              <div role="cell">Pages with traffic, paid ads, SaaS funnels, Shopify stores, or serious offers.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Report depth</div>
              <div role="cell">Short, direct diagnosis.</div>
              <div role="cell">More complete conversion action plan.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Score breakdown</div>
              <div role="cell">Core conversion score and key weak spots.</div>
              <div role="cell">Detailed score breakdown across clarity, offer, trust, CTA, friction, and objections.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Conversion leaks</div>
              <div role="cell">Top 3 issues to fix first.</div>
              <div role="cell">Top 3 issues with stronger reasoning, examples, and priority guidance.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Copy rewrites</div>
              <div role="cell">Basic headline, CTA, and messaging suggestions.</div>
              <div role="cell">Headline, subheadline, CTA, value proposition, trust section, and FAQ copy.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Category review</div>
              <div role="cell">Not included.</div>
              <div role="cell">Shopify, SaaS, sales page, course, service, or ad landing page specific checks.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">Action plan</div>
              <div role="cell">Short 7-day plan.</div>
              <div role="cell">Detailed 7-day plan with quick wins and bigger fixes.</div>
            </div>

            <div className="compare-row" role="row">
              <div className="compare-label" role="cell">FAQ & hooks</div>
              <div role="cell">Limited suggestions.</div>
              <div role="cell">Buyer objections, FAQ copy, and ad/social hooks you can test.</div>
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
