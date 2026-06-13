"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { tiers } from "../../lib/pricing";
import type { AuditInput, GenerateResponse, Tier } from "../../lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const [input, setInput] = useState<AuditInput | null>(null);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalTransactionId, setPaypalTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("audit-input");
    if (!raw) {
      router.replace("/");
      return;
    }
    setInput(JSON.parse(raw));
  }, [router]);

  const paymentLink = useMemo(() => {
    if (!input) return "#";
    const links: Record<Tier, string | undefined> = {
      basic: process.env.NEXT_PUBLIC_PAYPAL_BASIC_LINK,
      pro: process.env.NEXT_PUBLIC_PAYPAL_PRO_LINK
    };
    return links[input.tier] || "https://www.paypal.com";
  }, [input]);

  async function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input) return;
    setLoading(true);
    setError("");

    try {
      const payload: AuditInput = { ...input, paypalEmail, paypalTransactionId };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as GenerateResponse;
      if (!data.ok || !data.report) throw new Error(data.error || "Report generation failed");
      localStorage.setItem("audit-report", JSON.stringify({ report: data.report, input: payload, demo: data.demo || false, generatedAt: new Date().toISOString() }));
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!input) return null;

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><span className="logo" />AI Conversion Clinic</div>
          <a className="badge" href="/">Edit details</a>
        </nav>

        <section className="grid">
          <div className="panel">
            <h1 style={{ marginTop: 0 }}>Confirm your order</h1>
            <p className="muted">You selected <strong>{tiers[input.tier].name}</strong> for <strong>{tiers[input.tier].price}</strong>.</p>

            <div className="card" style={{ margin: "18px 0" }}>
              <strong>{input.product}</strong>
              <span>{input.url}</span><br />
              <span>Target customer: {input.audience}</span><br />
              <span>Main problem: {input.problem}</span>
            </div>

            <a className="cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }} href={paymentLink} target="_blank" rel="noreferrer">
              Open PayPal and complete payment
            </a>

            <p className="footer">Tip: Add your email in the PayPal note if possible: {input.email}</p>
          </div>

          <form className="panel" onSubmit={generateReport}>
            <h2 style={{ marginTop: 0 }}>Generate your report after payment</h2>
            <div className="notice">After completing payment, enter your PayPal payer email or transaction ID below so the order can be matched and your report can be generated.</div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>PayPal payer email</label>
              <input required type="email" placeholder="payer@example.com" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
            </div>

            <div className="field">
              <label>PayPal transaction ID or payment note</label>
              <input required placeholder="Example: 9AB12345CD6789012" value={paypalTransactionId} onChange={(e) => setPaypalTransactionId(e.target.value)} />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="cta" disabled={loading} type="submit" style={{ marginTop: 16 }}>
              {loading ? "Generating report..." : "I have paid. Generate my report"}
            </button>

            <button className="cta secondary" type="button" style={{ marginTop: 12 }} onClick={() => router.push("/")}>Edit details</button>
          </form>
        </section>
      </div>
    </main>
  );
}
