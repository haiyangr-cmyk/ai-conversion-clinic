"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tiers } from "../../lib/pricing";
import type { AuditInput, GenerateResponse } from "../../lib/types";

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function CheckoutPage() {
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

  useEffect(() => {
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

    if (!paymentComplete || !paypalOrderId || !paymentToken) {
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

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as GenerateResponse;

      if (!data.ok || !data.report) {
        throw new Error(data.error || "Report generation failed");
      }

      localStorage.setItem("audit-report", JSON.stringify({
        report: data.report,
      reportV2: data.reportV2 || null,
        input: payload,
        demo: data.demo || false,
        generatedAt: new Date().toISOString()
      }));

      router.push("/report");
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
            <h1 style={{ marginTop: 0 }}>Confirm your order</h1>
            <p className="muted">
              You selected <strong>{tiers[input.tier].name}</strong> for <strong>{tiers[input.tier].price}</strong>.
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
                  Complete payment securely with PayPal. Your report can only be generated after PayPal confirms the payment.
                </div>
                {paypalLoading && <p className="muted">Preparing secure PayPal checkout...</p>}
                <div ref={paypalRef} />
              </>
            )}

            {paymentComplete && (
              <div className="notice">
                Payment confirmed. Your PayPal order ID is <strong>{paypalOrderId}</strong>. You can now generate your conversion audit report.
              </div>
            )}

            <p className="footer">
              Payment is processed by PayPal. No shipping is required because this is a digital service.
            </p>
          </div>

          <form className="panel" onSubmit={generateReport}>
            <h2 style={{ marginTop: 0 }}>Generate your report</h2>

            <div className="notice">
              Once your PayPal payment is confirmed, click the button below to generate your audit automatically.
            </div>

            {error && <div className="error" style={{ marginTop: 18 }}>{error}</div>}

            <button className="cta" disabled={!paymentComplete || reportLoading} type="submit" style={{ marginTop: 18 }}>
              {reportLoading ? "Generating report..." : paymentComplete ? "Generate my report" : "Complete PayPal payment first"}
            </button>

            <button className="cta secondary" type="button" style={{ marginTop: 12 }} onClick={() => router.push("/")}>
              Edit details
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
