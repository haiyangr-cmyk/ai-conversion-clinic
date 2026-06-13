"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState("");
  const [demo, setDemo] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("audit-report");
    if (!raw) {
      router.replace("/");
      return;
    }
    const parsed = JSON.parse(raw);
    setReport(parsed.report || "");
    setDemo(Boolean(parsed.demo));
  }, [router]);

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!report) return null;

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><span className="logo" />AI Conversion Clinic</div>
          <a className="badge" href="/">Generate a new report</a>
        </nav>

        <section className="panel">
          {demo && <div className="notice" style={{ marginBottom: 18 }}>No AI API key is configured yet, so this is a demo report. Add your production AI provider key in Vercel environment variables before selling this publicly.</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
            <h1 style={{ margin: 0 }}>Conversion Audit Report</h1>
            <button className="cta" style={{ width: "auto" }} onClick={copyReport}>{copied ? "Copied" : "Copy report"}</button>
          </div>
          <article className="report">{report}</article>
        </section>
      </div>
    </main>
  );
}
