"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "./lib/analytics";
import type { AuditInput } from "../lib/types";

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
    title: "Free Diagnosis",
    text: "Find the biggest blockers hurting your page conversion."
  },
  {
    title: "Copy-ready Fixes",
    text: "Unlock rewritten copy, CTA ideas, trust fixes, and launch follow-up copy."
  },
  {
    title: "Action Plan",
    text: "Get a practical 7-day implementation plan after unlocking the solution."
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

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "server";

  const key = "acc2-visitor-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, value);
  return value;
}

export default function HomePage() {
  const router = useRouter();
  const [form, setForm] = useState<AuditInput>(initialForm);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState("");

  function update<K extends keyof AuditInput>(key: K, value: AuditInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "conversionGoal") {
      setDiagnosisError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.conversionGoal) {
      setDiagnosisError("Please choose a conversion goal before running the diagnosis.");
      return;
    }

    const payload: AuditInput = {
      ...form,
      tier: "basic",
      visitorId: getOrCreateVisitorId()
    };

    localStorage.setItem("audit-input", JSON.stringify(payload));
    setDiagnosisLoading(true);
    setDiagnosisError("");

    try {
      const useSampleFlow = process.env.NEXT_PUBLIC_ACC_USE_SAMPLE_FLOW === "true";

      if (!useSampleFlow) {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, generationMode: "diagnosis" })
        });

        const data = await res.json();

        if (!data.ok || !data.report) {
          throw new Error(data.error || "Diagnosis generation failed");
        }

        localStorage.setItem("audit-report", JSON.stringify({
          report: data.report,
          reportV2: data.reportV2 || null,
          input: payload,
          demo: data.demo || false,
          mode: "diagnosis",
          cached: Boolean(data.cached),
          diagnosisId: data.diagnosisId,
          cacheExpiresAt: data.cacheExpiresAt,
          generatedAt: new Date().toISOString()
        }));

        trackEvent("diagnosis_success", { source_path: "/" });
        router.push("/report");
        return;
      }

      const sampleReport = {
        meta: {
          tier: "basic",
          pageType: "landing_page",
          evidenceQuality: "medium",
          inputSummary: "Sample local diagnosis for testing the ACC 2.0 flow without calling the AI API."
        },
        executiveSummary: {
          overallScore: 64,
          oneSentenceDiagnosis: "The page explains the product, but it does not make the buyer outcome, trust proof, and next step clear enough in the first 5 seconds.",
          biggestOpportunity: "Make the hero section more outcome-specific and show proof before asking visitors to act.",
          primaryAction: "Rewrite the above-the-fold message around the visitor's desired outcome and add trust signals near the primary CTA."
        },
        scoreBreakdown: [
          { label: "Offer clarity", score: 62, reason: "The offer is visible, but the visitor outcome is not specific enough." },
          { label: "CTA strength", score: 58, reason: "The CTA does not clearly communicate what the visitor gets next." },
          { label: "Trust signals", score: 52, reason: "The page needs stronger proof, examples, or reassurance near the decision point." },
          { label: "Friction", score: 70, reason: "The flow is understandable, but the next step could feel lower-risk." }
        ],
        topLeaks: [
          {
            title: "Weak positioning above the fold",
            impact: "high",
            whyItHurts: "Visitors may understand the category but not why this offer matters to them right now.",
            whatToChange: "Lead with the target customer's desired outcome, not only the product category.",
            betterExample: "Turn more launch traffic into signups with a clear, conversion-focused page diagnosis."
          },
          {
            title: "Generic CTA",
            impact: "medium",
            whyItHurts: "A generic CTA creates uncertainty about what happens after the click.",
            whatToChange: "Use an action-oriented CTA that describes the next step.",
            betterExample: "Run Free Diagnosis"
          },
          {
            title: "Missing trust proof",
            impact: "medium",
            whyItHurts: "Users need evidence before trusting recommendations or paying for a fix plan.",
            whatToChange: "Add a sample diagnosis, support policy, and clear explanation of what is included.",
            betterExample: "See an example diagnosis before unlocking the full fix plan."
          }
        ],
        rewrites: [
          {
            type: "hero_headline",
            before: "AI-powered landing page audit",
            after: "Find out why your landing page isn’t converting.",
            whyThisWorks: "It names the pain directly and creates a reason to run the diagnosis."
          },
          {
            type: "primary_cta",
            before: "Get audit",
            after: "Run Free Diagnosis",
            whyThisWorks: "It lowers the first-step risk and aligns with the free diagnosis model."
          }
        ],
        categoryAudit: {
          summary: "This sample diagnosis focuses on the free diagnosis flow.",
          checks: []
        },
        priorityFixes: {
          quickWins: [
            {
              title: "Clarify the first-step value",
              action: "Make the first CTA about diagnosis, not payment.",
              expectedOutcome: "More visitors understand they can try the tool before paying."
            },
            {
              title: "Show a locked solution preview",
              action: "List the exact modules users can unlock after the diagnosis.",
              expectedOutcome: "Users see what the paid fix plan contains."
            }
          ],
          biggerFixes: []
        },
        buyerObjections: [],
        faqIdeas: [],
        hooks: [],
        sevenDayPlan: [
          { day: 1, title: "Rewrite hero message", action: "Use a pain-led headline and diagnosis-focused CTA.", expectedOutcome: "Visitors understand the offer faster." },
          { day: 2, title: "Add solution preview", action: "Show what is locked behind the full fix plan.", expectedOutcome: "Unlock intent becomes clearer." },
          { day: 3, title: "Add trust support", action: "Keep Support, Refund, and Privacy visible.", expectedOutcome: "Payment risk feels lower." }
        ],
        disclaimer: "This sample diagnosis is for local testing only. Recommendations should be validated with analytics, customer feedback, and A/B testing."
      };

      const sampleText = `# Free Conversion Diagnosis

Overall Score: 64/100

The page explains the product, but it does not make the buyer outcome, trust proof, and next step clear enough in the first 5 seconds.

## Top Conversion Blockers

1. Weak positioning above the fold — High severity
Visitors may understand the category but not why this offer matters to them right now.

2. Generic CTA — Medium severity
A generic CTA creates uncertainty about what happens after the click.

3. Missing trust proof — Medium severity
Users need evidence before trusting recommendations or paying for a fix plan.

## Solution Preview

We found practical fixes for positioning, hero copy, CTA, trust proof, offer framing, and launch follow-up copy.`;

      localStorage.setItem("audit-report", JSON.stringify({
        report: sampleText,
        reportV2: sampleReport,
        input: payload,
        demo: true,
        mode: "diagnosis",
        cached: false,
        diagnosisId: "dx_sample_local",
        cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        generatedAt: new Date().toISOString()
      }));

      trackEvent("diagnosis_success", { source_path: "/" });
      router.push("/report");
    } catch (err) {
      setDiagnosisError(err instanceof Error ? err.message : "Sample diagnosis failed. Please try again.");
    } finally {
      setDiagnosisLoading(false);
    }
  }

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><img className="brand-logo" src="/logo.jpeg" alt="AI Conversion Clinic logo" />AI Conversion Clinic</div>
          <div className="nav-links">
            <a href="/sample-report">Sample Report</a>
            <a href="/tools">Tools</a>
            <a href="/blog">Guides</a>
            <a className="badge" href="#audit-form">Free diagnosis · Paid fix plan</a>
          </div>
        </nav>

        <section className="grid">
          <div className="hero">
            <div className="eyebrow">AI-powered landing page audit</div>
            <h1>Find out why your landing page isn’t converting.</h1>
            <p>AI Conversion Clinic diagnoses your landing page, identifies the biggest conversion blockers, and generates a practical fix plan you can ship this week.</p>

            <div className="hero-actions">
              <a className="mini-cta" href="#audit-form">Run Free Diagnosis</a>
              <a className="mini-cta secondary" href="/sample-report">View Sample Report</a>
            </div>

            <div className="trust-bar" aria-label="Trust signals">
              <span>No account required</span>
              <span>Free diagnosis first</span>
              <span>Secure PayPal checkout</span>
              <span>Sample report available</span>
              <span>Refund policy available</span>
            </div>

            <div className="cards">
              <div className="card"><strong>Free Diagnosis</strong><span>Find the biggest blockers hurting your page conversion.</span></div>
              <div className="card"><strong>Copy-ready Fixes</strong><span>Unlock rewritten copy, CTA ideas, trust fixes, and launch follow-up copy.</span></div>
              <div className="card"><strong>Action Plan</strong><span>Get a practical 7-day implementation plan after unlocking the solution.</span></div>
            </div>

            <div className="steps">
              <div className="step">Submit your page URL, product, audience, and conversion problem.</div>
              <div className="step">Get a free diagnosis of your top conversion blockers.</div>
              <div className="step">Unlock the full fix plan if the diagnosis feels accurate.</div>
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
              <label>Conversion goal <span className="required-mark">*</span></label>
              <div className="price-grid conversion-goal-grid">
                <button
                  type="button"
                  className={`price-card goal-card ${form.conversionGoal === "signups" ? "active" : ""}`}
                  onClick={() => update("conversionGoal", "signups")}
                >
                  <strong>More signups</strong>
                  <span className="muted">Improve signup, waitlist, or trial conversion.</span>
                </button>

                <button
                  type="button"
                  className={`price-card goal-card ${form.conversionGoal === "paid_users" ? "active" : ""}`}
                  onClick={() => update("conversionGoal", "paid_users")}
                >
                  <strong>More paid users</strong>
                  <span className="muted">Improve paid conversion from traffic or free users.</span>
                </button>

                <button
                  type="button"
                  className={`price-card goal-card ${form.conversionGoal === "demo_calls" ? "active" : ""}`}
                  onClick={() => update("conversionGoal", "demo_calls")}
                >
                  <strong>More demo calls</strong>
                  <span className="muted">Improve demo, booking, or consultation conversion.</span>
                </button>

                <button
                  type="button"
                  className={`price-card goal-card ${form.conversionGoal === "launch_conversion" ? "active" : ""}`}
                  onClick={() => update("conversionGoal", "launch_conversion")}
                >
                  <strong>Launch conversion</strong>
                  <span className="muted">Optimize Product Hunt, Reddit, or launch traffic.</span>
                </button>
              </div>
            </div>

            <button className="cta" type="submit" disabled={diagnosisLoading}>
              {diagnosisLoading ? "Generating diagnosis..." : "Run Free Diagnosis"}
            </button>
            {diagnosisError ? (
              <>
                <p className="form-error">{diagnosisError}</p>
                {diagnosisError.includes("free diagnosis limit") ? (
                  <div className="limit-error-actions" aria-label="Limit recovery actions">
                    <a href="/sample-report">View Sample Report</a>
                    <a href="/blog">Read Conversion Guides</a>
                  </div>
                ) : null}
              </>
            ) : null}
            <p className="footer">Free diagnosis first · Secure PayPal checkout for the full fix plan</p>
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
              <br />
              <a href="/sample-report">View the full sample report →</a>
            </div>
          </div>
        </section>

        <section className="section comparison-section" id="compare-plans">
          <div className="section-heading compact">
            <span className="eyebrow">Solution Plans</span>
            <h2>Choose the depth you need</h2>
            <p>
              Basic gives you a quick diagnosis. Pro gives you a fuller action plan for pages with traffic,
              paid campaigns, or a real offer you want to improve.
              <br />
              <a href="/sample-report">Want to see what’s inside? View a sample report.</a>
            </p>
          </div>

          <div className="compare-table" role="table" aria-label="Conversion solution plan comparison">
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
