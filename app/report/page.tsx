"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditReportV2, CheckStatus, ImpactLevel, PageType } from "../../lib/report-v2";

const pageTypeLabels: Record<PageType, string> = {
  shopify_ecommerce: "Shopify / Ecommerce",
  saas: "SaaS",
  service_lead_gen: "Service / Lead Generation",
  course_coaching: "Course / Coaching",
  agency_consulting: "Agency / Consulting",
  software_app: "Software / App",
  unknown: "General Landing Page"
};

const impactLabels: Record<ImpactLevel, string> = {
  high: "High Impact",
  medium: "Medium Impact",
  low: "Low Impact"
};

const scoreLabels = {
  clarity: "Clarity",
  offer: "Offer Strength",
  trust: "Trust",
  cta: "CTA",
  friction: "Friction",
  objectionHandling: "Objection Handling"
} as const;

const statusLabels: Record<CheckStatus, string> = {
  strong: "Strong",
  medium: "Medium",
  weak: "Weak",
  missing: "Missing"
};

function scoreLevel(score: number) {
  if (score >= 75) return "strong";
  if (score >= 55) return "medium";
  return "weak";
}

function safeScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function V2Report({ report }: { report: AuditReportV2 }) {
  const overallScore = safeScore(report.executiveSummary.overallScore);
  const overallLevel = scoreLevel(overallScore);

  return (
    <div className="report-v2">
      <section className="report-hero">
        <div>
          <span className="eyebrow">Executive summary</span>
          <h1>Your page scored {overallScore}/100</h1>
          <p>{report.executiveSummary.oneSentenceDiagnosis}</p>
        </div>

        <div className={`score-ring ${overallLevel}`}>
          <span>{overallScore}</span>
          <small>/100</small>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Page Type</span>
          <strong>{pageTypeLabels[report.meta.pageType] || "General Landing Page"}</strong>
          <p>{report.categoryAudit.summary}</p>
        </div>

        <div className="summary-card">
          <span>Biggest Opportunity</span>
          <strong>{report.executiveSummary.biggestOpportunity}</strong>
          <p>{report.executiveSummary.whyItMatters}</p>
        </div>

        <div className="summary-card">
          <span>Primary Action</span>
          <strong>{report.executiveSummary.primaryAction}</strong>
          <p>{report.meta.evidenceNote}</p>
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">Score breakdown</span>
          <h2>Where the page is leaking conversions</h2>
        </div>

        <div className="score-list">
          {report.scoreBreakdown.map((item) => {
            const score = safeScore(item.score);
            return (
              <div className="score-row" key={item.key}>
                <div className="score-row-top">
                  <strong>{scoreLabels[item.key] || item.label}</strong>
                  <span>{score}/100</span>
                </div>
                <div className="score-bar">
                  <div style={{ width: `${score}%` }} />
                </div>
                <p>{item.reason}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">Top conversion leaks</span>
          <h2>The 3 issues to fix first</h2>
        </div>

        <div className="leak-grid">
          {report.topLeaks.map((leak, index) => (
            <article className="leak-card" key={`${leak.title}-${index}`}>
              <div className="leak-card-top">
                <span>Leak {index + 1}</span>
                <b className={`impact ${leak.impact}`}>{impactLabels[leak.impact]}</b>
              </div>
              <h3>{leak.title}</h3>
              <p><strong>Why it hurts:</strong> {leak.whyItHurts}</p>
              <p><strong>What to change:</strong> {leak.whatToChange}</p>
              <div className="example-box">
                <span>Better example</span>
                <strong>{leak.betterExample}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">Before / After rewrites</span>
          <h2>Copy you can test immediately</h2>
        </div>

        <div className="rewrite-grid">
          {report.rewrites.map((item, index) => (
            <article className="rewrite-card" key={`${item.type}-${index}`}>
              <span className="rewrite-type">{item.type.replace(/_/g, " ")}</span>
              <div className="rewrite-columns">
                <div>
                  <small>Before</small>
                  <p>{item.before}</p>
                </div>
                <div>
                  <small>After</small>
                  <p>{item.after}</p>
                </div>
              </div>
              <p className="why-copy">{item.whyThisWorks}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">Category-specific review</span>
          <h2>{pageTypeLabels[report.categoryAudit.pageType] || "Page"} checks</h2>
        </div>

        <div className="category-checks">
          {report.categoryAudit.checks.map((check, index) => (
            <article className="check-card" key={`${check.label}-${index}`}>
              <div>
                <strong>{check.label}</strong>
                <span className={`status ${check.status}`}>{statusLabels[check.status]}</span>
              </div>
              <p>{check.comment}</p>
              <b>{check.recommendation}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section two-column">
        <div>
          <div className="section-heading compact">
            <span className="eyebrow">Quick wins</span>
            <h2>Fix these first</h2>
          </div>
          <div className="fix-list">
            {report.priorityFixes.quickWins.map((fix, index) => (
              <article className="fix-card" key={`${fix.title}-${index}`}>
                <strong>{fix.title}</strong>
                <p>{fix.reason}</p>
                <b>{fix.action}</b>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <span className="eyebrow">Bigger fixes</span>
            <h2>Plan these next</h2>
          </div>
          <div className="fix-list">
            {report.priorityFixes.biggerFixes.map((fix, index) => (
              <article className="fix-card" key={`${fix.title}-${index}`}>
                <strong>{fix.title}</strong>
                <p>{fix.reason}</p>
                <b>{fix.action}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">7-day action plan</span>
          <h2>What to do next</h2>
        </div>

        <div className="timeline">
          {report.sevenDayPlan.map((item) => (
            <article className="timeline-item" key={item.day}>
              <span>Day {item.day}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.action}</p>
                <small>{item.expectedOutcome}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section two-column">
        <div>
          <div className="section-heading compact">
            <span className="eyebrow">Buyer objections</span>
            <h2>Questions to answer before the CTA</h2>
          </div>
          <div className="fix-list">
            {report.buyerObjections.map((item, index) => (
              <article className="fix-card" key={`${item.objection}-${index}`}>
                <strong>{item.objection}</strong>
                <p>{item.pageResponse}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <span className="eyebrow">FAQ recommendations</span>
            <h2>FAQ copy to add</h2>
          </div>
          <div className="fix-list">
            {report.faqRecommendations.map((item, index) => (
              <article className="fix-card" key={`${item.question}-${index}`}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">Ad / social hooks</span>
          <h2>Hooks you can test</h2>
        </div>

        <div className="hook-grid">
          {report.adSocialHooks.map((hook, index) => (
            <div className="hook-card" key={`${hook}-${index}`}>{hook}</div>
          ))}
        </div>
      </section>

      <div className="notice">{report.disclaimer}</div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState("");
  const [reportV2, setReportV2] = useState<AuditReportV2 | null>(null);
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
    setReportV2(parsed.reportV2 || null);
    setDemo(Boolean(parsed.demo));
  }, [router]);

  const copyText = useMemo(() => {
    if (report) return report;
    if (!reportV2) return "";
    return JSON.stringify(reportV2, null, 2);
  }, [report, reportV2]);

  async function copyReport() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!report && !reportV2) return null;

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><img className="brand-logo" src="/logo.jpeg" alt="AI Conversion Clinic logo" />AI Conversion Clinic</div>
          <a className="badge" href="/">Generate a new report</a>
        </nav>

        <section className="panel report-panel">
          {demo && <div className="notice" style={{ marginBottom: 18 }}>No AI API key is configured yet, so this is a demo report. Add your production AI provider key in Vercel environment variables before selling this publicly.</div>}

          <div className="report-header">
            <div>
              <span className="eyebrow">Generated report</span>
              <h1>Conversion Audit Report</h1>
            </div>
            <button className="cta copy-button" onClick={copyReport}>{copied ? "Copied" : "Copy report"}</button>
          </div>

          {reportV2 ? (
            <V2Report report={reportV2} />
          ) : (
            <article className="report">{report}</article>
          )}
        </section>
      </div>
    </main>
  );
}
