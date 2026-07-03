"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "../lib/analytics";
import { tiers } from "../../lib/pricing";
import type { AuditInput, GenerateResponse, Tier } from "../../lib/types";

declare global {
  interface Window {
    paypal?: any;
  }
}

function buildLocalSampleSolution(tier: Tier) {
  if (tier === "pro") {
    return `# Pro Fix Plan

## Recommended Positioning

Position the page around the visitor's desired conversion outcome, then connect that outcome to a clearer page flow, proof placement, and next-step CTA.

## Hero Rewrite

Headline:
Find out why your landing page is not converting — then fix the highest-impact blockers.

Subheadline:
Run a free diagnosis first. If the diagnosis is accurate, unlock a full fix plan with copy, structure, proof, offer, and testing recommendations.

Primary CTA:
Run Free Diagnosis

## Hero Variants

1. Find the conversion blockers costing your landing page signups.
2. Diagnose your landing page before spending more on traffic.
3. Turn unclear page messaging into a practical conversion fix plan.

## CTA Fixes

Use one primary CTA before payment and one clear unlock CTA after diagnosis.

## CTA Variants

1. Run Free Diagnosis
2. Diagnose My Landing Page
3. Unlock My Fix Plan

## Section-by-Section Page Rewrite

Hero: Lead with the conversion problem.
Proof section: Show sample output and support terms before payment.
Offer section: Explain what the user gets after unlocking.
CTA section: Keep the next step specific and low-friction.

## Trust & Proof Plan

Add a sample diagnosis, support/refund links, privacy link, and a clear explanation that recommendations should be validated with analytics and testing.

## Pricing / Offer Variants

Keep the paid offer simple. Compare Basic and Pro by depth of solution, not by unsupported claims.

## Objection Handling / FAQ

Q: Is the diagnosis free?
A: Yes. The diagnosis identifies blockers before payment.

Q: What does Pro include?
A: Pro includes deeper variants, section guidance, objection handling, testing guidance, and follow-up copy.

## A/B Testing Plan

Test one headline, one CTA, and one proof placement change before changing the whole page.

## 7-Day Implementation Plan

Day 1: Rewrite the hero around the main conversion problem.
Day 2: Add diagnosis and solution CTA flow.
Day 3: Add sample output and support links.
Day 4: Improve proof placement.
Day 5: Add FAQ / objection handling.
Day 6: Test Product Hunt or Reddit traffic.
Day 7: Review unlock clicks and checkout conversion.

## 14-Day Follow-up Checklist

Days 8-10: Review analytics and scroll depth.
Days 11-12: Test CTA variation.
Days 13-14: Decide whether to keep, revise, or roll back changes.

## Product Hunt Launch Copy

I rebuilt AI Conversion Clinic around a free diagnosis first, full fix plan second model. The goal is to help founders see landing page blockers before paying for a full fix plan.

## Reddit Post & Comment Variants

Post idea:
I changed my landing page audit product from paid-first to free diagnosis first. What would you need to see before paying for the full fix plan?

Comment idea:
Happy to share the free diagnosis flow if useful. I am trying to learn whether the diagnosis feels accurate before asking users to unlock the full fix plan.

## Important Note

Recommendations should be validated with analytics, customer feedback, and A/B testing.`;
  }

  return `# Quick Fix Report

## Recommended Positioning

For teams with traffic but low conversion, position the page around the visitor's desired outcome instead of the product category.

## Hero Rewrite

Headline:
Find out why your landing page isn't converting.

Subheadline:
Get a free diagnosis of your biggest conversion blockers, then unlock a practical fix plan you can ship this week.

Primary CTA:
Run Free Diagnosis

## CTA Fixes

- Use "Run Free Diagnosis" before payment.
- Use "Unlock Fix Plan" after the diagnosis.
- Avoid generic CTAs like "Get Started" when the user does not yet know the value.

## Trust & Proof Fixes

- Keep Support, Refund, and Privacy visible.
- Show an example diagnosis before asking for payment.
- Explain that recommendations should be validated with analytics and testing.

## Pricing / Offer Fixes

- Make the first step free.
- Make the paid step about unlocking exact fixes, not buying a longer report.
- Keep the paid offer simple and low-friction.

## 7-Day Action Plan

Day 1: Rewrite the hero message around the visitor's pain.
Day 2: Replace generic CTAs with diagnosis and solution CTAs.
Day 3: Add a locked fix plan preview.
Day 4: Add trust and support notes near payment.
Day 5: Add an example diagnosis page.
Day 6: Test one high-intent Reddit or Product Hunt traffic source.
Day 7: Review unlock clicks and payment conversion.

## Product Hunt / Reddit Follow-up Copy

I updated AI Conversion Clinic around a clearer model: diagnosis is free, solutions are paid. Paste your landing page to see the top blockers, then unlock a practical fix plan if the diagnosis feels accurate.

## Important Note

Recommendations should be validated with analytics, customer feedback, and A/B testing.`;
}

export default function CheckoutPage() {
  const isLocalDevCheckout =
    typeof window !== "undefined" &&
    window.location.hostname === "localhost";
  const router = useRouter();
  const paypalRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState<AuditInput | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const [paymentToken, setPaymentToken] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("audit-input");
    if (!raw) {
      router.replace("/");
      return;
    }
    setInput(JSON.parse(raw));
  }, [router]);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";

  const paypalSdkUrl = useMemo(() => {
    if (!clientId) return "";
    return `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons&locale=en_US&disable-funding=paylater`;
  }, [clientId, currency]);

  function selectTier(tier: Tier) {
    setInput((prev) => {
      if (!prev) return prev;

      const next = { ...prev, tier };
      localStorage.setItem("audit-input", JSON.stringify(next));
      return next;
    });

    setPaypalOrderId("");
    setPaymentToken("");
    setPaymentComplete(false);
    setError("");

    if (paypalRef.current) {
      paypalRef.current.innerHTML = "";
    }

    if (clientId) {
      setPaypalLoading(true);
    }
  }

  useEffect(() => {
    if (isLocalDevCheckout) {
      setPaypalLoading(false);
      setError("");
      if (paypalRef.current) {
        paypalRef.current.innerHTML = "";
      }
      return;
    }

    if (!input || !paypalRef.current || paymentComplete) return;

    async function renderButtons() {
      if (!paypalRef.current || !input) return;
      if (!window.paypal?.Buttons) {
        setError("PayPal SDK failed to load. Please refresh the page.");
        return;
      }

      paypalRef.current.innerHTML = "";
      setPaypalLoading(false);

      window.paypal.Buttons({
        style: {
          layout: "vertical",
          shape: "rect",
          label: "paypal"
        },

        async createOrder() {
          setError("");

          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tier: input.tier })
          });

          const data = await res.json();

          if (!data.ok || !data.id) {
            throw new Error(data.error || "Could not create PayPal order");
          }

          trackEvent("paypal_order_created", {
            tier: input.tier,
            currency
          });

          return data.id;
        },

        async onApprove(data: { orderID: string }) {
          setError("");
          setPaypalLoading(true);

          try {
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderID,
                tier: input.tier
              })
            });

            const result = await res.json();

            if (!result.ok || !result.paymentToken) {
              throw new Error(result.error || "Payment capture failed");
            }

            setPaypalOrderId(result.orderId);
            setPaymentToken(result.paymentToken);
            setPaymentComplete(true);
            trackEvent("paypal_payment_completed", {
              tier: input.tier,
              currency
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment capture failed. Please contact support.");
          } finally {
            setPaypalLoading(false);
          }
        },

        onCancel() {
          setError("Payment was cancelled. You can try again whenever you are ready.");
        },

        onError(err: unknown) {
          console.error("PAYPAL_BUTTON_ERROR", err);
          setError("PayPal checkout failed. Please refresh the page or try again in a few seconds.");
        }
      }).render(paypalRef.current);
    }

    if (!clientId) {
      setPaypalLoading(false);
      setError("Missing PayPal Client ID. Please configure NEXT_PUBLIC_PAYPAL_CLIENT_ID.");
      return;
    }

    if (window.paypal?.Buttons) {
      renderButtons();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", renderButtons, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = paypalSdkUrl;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = renderButtons;
    script.onerror = () => {
      setPaypalLoading(false);
      setError("PayPal checkout did not load. Please refresh the page or try again in a few seconds.");
    };
    document.body.appendChild(script);
  }, [input, clientId, currency, paypalSdkUrl, paymentComplete]);

  async function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input) return;

    if (!isLocalDevCheckout && (!paymentComplete || !paypalOrderId || !paymentToken)) {
      setError("Please complete PayPal payment before generating your report.");
      return;
    }

    setReportLoading(true);
    setError("");

    try {
      const payload: AuditInput = {
        ...input,
        paypalTransactionId: paypalOrderId,
        paypalOrderId,
        paymentToken
      };

      const useLocalSampleSolution = process.env.NEXT_PUBLIC_ACC_USE_SAMPLE_FLOW === "true";

      if (useLocalSampleSolution) {
        const sampleSolution = buildLocalSampleSolution(input.tier);

        localStorage.setItem("audit-report", JSON.stringify({
          report: sampleSolution,
          reportV2: null,
          input: payload,
          demo: true,
          localSample: true,
          mode: "solution",
          generatedAt: new Date().toISOString()
        }));
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, generationMode: "solution" })
        });

        const data = (await res.json()) as GenerateResponse;

        if (!data.ok || !data.report) {
          throw new Error(data.error || "Solution generation failed");
        }

        localStorage.setItem("audit-report", JSON.stringify({
          report: data.report,
          reportV2: data.reportV2 || null,
          input: payload,
          demo: data.demo || false,
          mode: "solution",
          generatedAt: new Date().toISOString()
        }));
      }

      trackEvent("paid_fix_plan_generated", {
        tier: input.tier
      });

      // Use a hard navigation after writing the report payload.
      // In local dev, router.push can request /report but leave the visible page on /checkout after state refreshes.
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      window.location.assign("/report");
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  if (!input) return null;

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><img className="brand-logo-img" src="/logo.jpeg" alt="AI Conversion Clinic logo" width={36} height={36} />AI Conversion Clinic</div>
          <a className="badge" href="/">Edit details</a>
        </nav>

        <section className="grid">
          <div className="panel">
            <h1 style={{ marginTop: 0 }}>Unlock your full fix plan</h1>
            <p className="muted">Choose the depth of the full fix plan you want to unlock.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "18px 0" }}>
              {(["basic", "pro"] as Tier[]).map((tier) => {
                const selected = input.tier === tier;

                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => selectTier(tier)}
                    style={{
                      textAlign: "left",
                      borderRadius: 18,
                      border: selected ? "2px solid #8ee6cf" : "1px solid rgba(142, 230, 207, 0.28)",
                      background: selected ? "rgba(142, 230, 207, 0.10)" : "rgba(255,255,255,0.03)",
                      color: "inherit",
                      padding: 18,
                      cursor: "pointer"
                    }}
                  >
                    <span className="eyebrow">{tier === "pro" ? "Recommended" : "Quick"}</span>
                    <strong style={{ display: "block", marginTop: 8 }}>{tiers[tier].name}</strong>
                    <span style={{ display: "block", fontSize: 28, fontWeight: 900, marginTop: 8 }}>{tiers[tier].price}</span>
                    <p className="muted" style={{ marginBottom: 10 }}>{tiers[tier].description}</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {tiers[tier].features.slice(0, 4).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <p className="muted">
              Selected: <strong>{tiers[input.tier].name}</strong> for <strong>{tiers[input.tier].price}</strong>.
            </p>

              <p className="checkout-tier-guidance">
                Start with Quick Fix Report. Choose Pro Fix Plan if you want more copy variants and section-by-section rewrites.
              </p>

            <div className="card" style={{ margin: "18px 0" }}>
              <strong>{input.product}</strong>
              <span>{input.url}</span><br />
              <span>Target customer: {input.audience}</span><br />
              <span>Main problem: {input.problem}</span>
            </div>

            {!paymentComplete && (
              <>
                <div className="notice" style={{ marginBottom: 18 }}>
                  Complete payment securely with PayPal. Your full fix plan can only be generated after PayPal confirms the payment.
                </div>
                {!paymentComplete ? (
                  <div className="checkout-before-pay-card" aria-label="Before you pay">
                    <div className="checkout-before-pay-header">
                      <span>Before you pay</span>
                      <strong>Only unlock the full fix plan if the free diagnosis feels accurate.</strong>
                    </div>

                    <ul className="checkout-before-pay-list">
                      <li>
                        <strong>Review the diagnosis first</strong>
                        <span>Your payment unlocks a deeper, copy-ready fix plan based on the diagnosis you just received.</span>
                      </li>
                      <li>
                        <strong>Pay securely with PayPal</strong>
                        <span>Payment is handled by PayPal. We do not store your card or bank details.</span>
                      </li>
                      <li>
                        <strong>Generate after confirmation</strong>
                        <span>After PayPal confirms payment, return here and generate your full fix plan automatically.</span>
                      </li>
                      <li>
                        <strong>Support is available</strong>
                        <span>If payment succeeds but generation fails, contact support with your PayPal order ID. See the <a href="/refund">refund policy</a>.</span>
                      </li>
                    </ul>
                  </div>
                ) : null}

                {paypalLoading && <p className="muted">Preparing secure PayPal checkout...</p>}
                <div ref={paypalRef} />
              </>
            )}

            {paymentComplete && (
              <div className="notice">
                Payment confirmed. Your PayPal order ID is <strong>{paypalOrderId}</strong>. You can now generate your fix plan.
              </div>
            )}

            <p className="footer">
              Payment is processed by PayPal. No shipping is required because this is a digital service.
            </p>
          </div>

          <form className="panel" onSubmit={generateReport}>
            <h2 style={{ marginTop: 0 }}>Generate your full fix plan</h2>

            <div className="notice">
              Once your PayPal payment is confirmed, generate your full fix plan automatically.
            </div>

            {error && <div className="error" style={{ marginTop: 18 }}>{error}</div>}

            <button className="cta" disabled={!paymentComplete || reportLoading} type="submit" style={{ marginTop: 18 }}>
              {reportLoading ? "Generating fix plan..." : paymentComplete ? `Generate ${tiers[input.tier].name}` : "Complete PayPal payment first"}
            </button>

                      {isLocalDevCheckout && (
            <button
              className="cta secondary dev-skip-button"
              type="button"
              onClick={() => {
                const form = document.querySelector("form");
                form?.requestSubmit();
              }}
            >
              Generate test fix plan without PayPal
            </button>
          )}

<button className="cta secondary" type="button" style={{ marginTop: 12 }} onClick={() => router.push("/")}>
              Edit details
            </button>
        <div className="payment-safety-note checkout-action-help">
          <strong>Need help?</strong>
          <span>
            If your payment succeeds but your fix plan does not generate, <a href="/support">contact support</a> with your PayPal order ID.
          </span>
        </div>
          </form>
        </section>
      </div>
    </main>
  );
}
