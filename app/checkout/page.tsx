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
      if (!data.ok || !data.report) throw new Error(data.error || "生成失败");
      localStorage.setItem("audit-report", JSON.stringify({ report: data.report, input: payload, demo: data.demo || false, generatedAt: new Date().toISOString() }));
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (!input) return null;

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><span className="logo" />AI 转化率急诊室</div>
          <a className="badge" href="/">返回修改信息</a>
        </nav>

        <section className="grid">
          <div className="panel">
            <h1 style={{ marginTop: 0 }}>确认订单</h1>
            <p className="muted">你选择的是 <strong>{tiers[input.tier].name}</strong>，价格 <strong>{tiers[input.tier].price}</strong>。</p>

            <div className="card" style={{ margin: "18px 0" }}>
              <strong>{input.product}</strong>
              <span>{input.url}</span><br />
              <span>目标客户：{input.audience}</span><br />
              <span>当前问题：{input.problem}</span>
            </div>

            <a className="cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }} href={paymentLink} target="_blank" rel="noreferrer">
              打开 PayPal 完成付款
            </a>

            <p className="footer">付款时建议在 PayPal 备注里填写你的邮箱：{input.email}</p>
          </div>

          <form className="panel" onSubmit={generateReport}>
            <h2 style={{ marginTop: 0 }}>付款后生成报告</h2>
            <div className="notice">第一天版本采用 PayPal 收款链接，不做自动支付回调。你可以先让用户付款后输入 PayPal 邮箱或交易号，后台人工抽查即可。</div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>PayPal 付款邮箱</label>
              <input required type="email" placeholder="payer@example.com" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
            </div>

            <div className="field">
              <label>PayPal 交易号或付款备注</label>
              <input required placeholder="例如：9AB12345CD6789012" value={paypalTransactionId} onChange={(e) => setPaypalTransactionId(e.target.value)} />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="cta" disabled={loading} type="submit" style={{ marginTop: 16 }}>
              {loading ? "正在生成报告..." : "我已付款，生成报告"}
            </button>

            <button className="cta secondary" type="button" style={{ marginTop: 12 }} onClick={() => router.push("/")}>返回修改信息</button>
          </form>
        </section>
      </div>
    </main>
  );
}
