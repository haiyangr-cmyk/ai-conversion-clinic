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
          <div className="brand"><span className="logo" />AI 转化率急诊室</div>
          <a className="badge" href="/">生成新报告</a>
        </nav>

        <section className="panel">
          {demo && <div className="notice" style={{ marginBottom: 18 }}>当前没有配置 OPENAI_API_KEY，所以这是演示报告。部署正式版前请在 Vercel 环境变量里填写 OpenAI API Key。</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
            <h1 style={{ margin: 0 }}>诊断报告</h1>
            <button className="cta" style={{ width: "auto" }} onClick={copyReport}>{copied ? "已复制" : "复制报告"}</button>
          </div>
          <article className="report">{report}</article>
        </section>
      </div>
    </main>
  );
}
