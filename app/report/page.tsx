"use client";

import { jsPDF } from "jspdf";
import {
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";

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



function buildReportBaseName(reportV2: AuditReportV2 | null) {
  const tier = reportV2?.meta?.tier === "pro" ? "Pro" : "Basic";
  const date = new Date().toISOString().slice(0, 10);
  return `AIConversionClinic-${tier}-Audit-${date}`;
}

function normalizeExportText(text: string) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .trim();
}

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function downloadPdfFile(filename: string, content: string) {
  const text = normalizeExportText(content);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 56;

  function addPageIfNeeded(height: number) {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = 56;
    }
  }

  function writeWrapped(raw: string, options?: { size?: number; bold?: boolean; indent?: number; gap?: number }) {
    const size = options?.size ?? 10;
    const indent = options?.indent ?? 0;
    const gap = options?.gap ?? 7;

    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(size);

    const wrapped = doc.splitTextToSize(raw, maxWidth - indent) as string[];
    const lineHeight = size + 4;

    addPageIfNeeded(wrapped.length * lineHeight + gap);
    doc.text(wrapped, margin + indent, y);
    y += wrapped.length * lineHeight + gap;
  }

  doc.setProperties({
    title: filename.replace(/\.pdf$/i, ""),
    subject: "AI Conversion Clinic Audit Report",
    creator: "AI Conversion Clinic"
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AI Conversion Clinic", margin, 32);

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      y += 8;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      writeWrapped(trimmed.replace(/^#\s+/, ""), { size: 22, bold: true, gap: 14 });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      y += 6;
      writeWrapped(trimmed.replace(/^##\s+/, ""), { size: 14, bold: true, gap: 8 });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      writeWrapped(`• ${trimmed.replace(/^-\s+/, "")}`, { size: 10, indent: 12, gap: 5 });
      continue;
    }

    if (/^(Action|Success check):/i.test(trimmed)) {
      writeWrapped(trimmed, { size: 10, indent: 14, gap: 5 });
      continue;
    }

    writeWrapped(trimmed, { size: 10, gap: 6 });
  }

  doc.save(filename);
}

function buildDocxParagraph(line: string) {
  const trimmed = normalizeExportText(line);

  if (!trimmed) {
    return new Paragraph({ text: "" });
  }

  if (trimmed.startsWith("# ")) {
    return new Paragraph({
      text: trimmed.replace(/^#\s+/, ""),
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 }
    });
  }

  if (trimmed.startsWith("## ")) {
    return new Paragraph({
      text: trimmed.replace(/^##\s+/, ""),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 220, after: 120 }
    });
  }

  if (trimmed.startsWith("- ")) {
    return new Paragraph({
      children: [new TextRun(`• ${trimmed.replace(/^-\s+/, "")}`)],
      spacing: { after: 80 }
    });
  }

  const labelMatch = trimmed.match(/^(Action|Success check):\s*(.*)$/i);
  if (labelMatch) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${labelMatch[1]}: `, bold: true }),
        new TextRun(labelMatch[2])
      ],
      spacing: { after: 80 }
    });
  }

  return new Paragraph({
    children: [new TextRun(trimmed)],
    spacing: { after: 100 }
  });
}

async function downloadDocxFile(filename: string, content: string) {
  const text = normalizeExportText(content);
  const doc = new DocxDocument({
    creator: "AI Conversion Clinic",
    title: filename.replace(/\.docx$/i, ""),
    description: "AI Conversion Clinic Audit Report",
    sections: [
      {
        properties: {},
        children: text.split(/\r?\n/).map(buildDocxParagraph)
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlobFile(filename, blob);
}

function V2Report({ report }: { report: AuditReportV2 }) {
  const overallScore = safeScore(report.executiveSummary.overallScore);
  const overallLevel = scoreLevel(overallScore);
  const isPro = report.meta.tier === "pro";
  const tierLabel = isPro ? "Solution Pro" : "Conversion Solution";
  const visibleRewrites = isPro ? report.rewrites.slice(0, 5) : report.rewrites.slice(0, 3);
  const visibleQuickWins = report.priorityFixes.quickWins.slice(0, 3);
  const visibleSevenDayPlan = report.sevenDayPlan.slice(0, 7);

  return (
    <div className="report-v2">
      <section className="report-hero">
        <div>
          <span className="eyebrow">{tierLabel} · Executive summary</span>
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
          {visibleRewrites.map((item, index) => (
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

      {isPro && (
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
      )}

      <section className={isPro ? "report-section two-column" : "report-section"}>
        <div>
          <div className="section-heading compact">
            <span className="eyebrow">Quick wins</span>
            <h2>Fix these first</h2>
          </div>
          <div className="fix-list">
            {visibleQuickWins.map((fix, index) => (
              <article className="fix-card" key={`${fix.title}-${index}`}>
                <strong>{fix.title}</strong>
                <p>{fix.reason}</p>
                <b>{fix.action}</b>
              </article>
            ))}
          </div>
        </div>

        {isPro && (
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
        )}
      </section>

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">7-day action plan</span>
          <h2>What to do next</h2>
        </div>

        <div className="timeline">
          {visibleSevenDayPlan.map((item) => (
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

      {isPro && (
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
      )}

      {isPro && (
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
      )}

      <div className="notice">{report.disclaimer}</div>
    </div>
  );
}


function FormattedTextReport({ text }: { text: string }) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <article className="formatted-report">
      {lines.map((line, index) => {
        if (line.startsWith("# ")) {
          return <h2 key={index}>{line.replace(/^#\s+/, "")}</h2>;
        }

        if (line.startsWith("## ")) {
          return <h3 key={index}>{line.replace(/^##\s+/, "")}</h3>;
        }

        if (line.startsWith("- ")) {
          return <p className="formatted-bullet" key={index}>{line.replace(/^-\s+/, "")}</p>;
        }

        if (/^Day\s+\d+:/i.test(line)) {
          return <p className="formatted-day" key={index}>{line}</p>;
        }

        if (/^[A-Za-z /]+:$/.test(line)) {
          return <p className="formatted-label" key={index}>{line}</p>;
        }

        return <p key={index}>{line}</p>;
      })}
    </article>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState("");
  const [reportV2, setReportV2] = useState<AuditReportV2 | null>(null);
  const [demo, setDemo] = useState(false);
  const [localSample, setLocalSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportMode, setReportMode] = useState<"diagnosis" | "solution">("solution");

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
    setLocalSample(Boolean(parsed.localSample));
    setReportMode(parsed.mode === "diagnosis" ? "diagnosis" : "solution");
  }, [router]);

  const exportText = useMemo(() => {
    const reportText = typeof report === "string" ? report.trim() : "";

    if (reportText) return reportText;
    if (reportV2) return JSON.stringify(reportV2, null, 2);

    return "";
  }, [report, reportV2]);

  const copyText = exportText;

  function downloadPdfReport() {
    if (!exportText) return;

    downloadPdfFile(`${buildReportBaseName(reportV2)}.pdf`, exportText);
  }

  async function downloadDocxReport() {
    if (!exportText) return;

    await downloadDocxFile(`${buildReportBaseName(reportV2)}.docx`, exportText);
  }

  async function copyReport() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function unlockConversionSolution() {
    const raw = localStorage.getItem("audit-report");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.input) {
          localStorage.setItem("audit-input", JSON.stringify({
            ...parsed.input,
            tier: "basic"
          }));
        }
      } catch {
        // Keep checkout fallback behavior.
      }
    }

    router.push("/checkout");
  }

  if (!report && !reportV2) return null;

  return (
    <main className="wrapper">
      <div className="container">
        <nav className="nav">
          <div className="brand"><img className="brand-logo" src="/logo.jpeg" alt="AI Conversion Clinic logo" />AI Conversion Clinic</div>
          <a className="badge" href="/">{reportMode === "diagnosis" ? "Run another diagnosis" : "Generate a new report"}</a>
        </nav>

        <section className="panel report-panel">
          {demo && !localSample && reportMode !== "diagnosis" && <div className="notice" style={{ marginBottom: 18 }}>No AI API key is configured yet, so this is a demo report. Add your production AI provider key in Vercel environment variables before selling this publicly.</div>}

          <div className="report-header">
            <div>
              <span className="eyebrow">{reportMode === "diagnosis" ? "Generated diagnosis" : "Generated solution"}</span>
              <h1>{reportMode === "diagnosis" ? "Your Conversion Diagnosis" : "Conversion Solution"}</h1>
            </div>
                        <button
              className="report-export-button primary-export-button"
              type="button"
              onClick={downloadPdfReport}
              disabled={!exportText}
            >
              Download PDF
            </button>

            <button
              className="report-export-button secondary-export-button"
              type="button"
              onClick={downloadDocxReport}
              disabled={!exportText}
            >
              Download DOCX
            </button>
<button className="cta copy-button" onClick={copyReport}>{copied ? "Copied" : reportMode === "diagnosis" ? "Copy diagnosis" : "Copy solution"}</button>
          </div>

          {reportMode === "diagnosis" && reportV2 ? (
            <section className="diagnosis-result">
              <div className="diagnosis-score-card">
                <span>Conversion Score</span>
                <strong>{reportV2.executiveSummary.overallScore} / 100</strong>
                <p>{reportV2.executiveSummary.oneSentenceDiagnosis}</p>
              </div>

              <div className="diagnosis-section">
                <p className="eyebrow">Free Diagnosis</p>
                <h2>Top Conversion Blockers</h2>

                <div className="diagnosis-blocker-grid">
                  {reportV2.topLeaks.slice(0, 3).map((leak, index) => (
                    <article className="diagnosis-blocker-card" key={`${leak.title}-${index}`}>
                      <span>#{index + 1} · {leak.impact} severity</span>
                      <h3>{leak.title}</h3>
                      <p>{leak.whyItHurts}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="diagnosis-section solution-preview-box">
                <p className="eyebrow">Solution Preview</p>
                <h2>We found practical fixes for this page.</h2>
                <p>
                  Unlock the full Conversion Solution to get copy-ready fixes for positioning,
                  hero copy, CTA, trust proof, offer framing, implementation plan, and launch follow-up copy.
                </p>
              </div>

              <section className="locked-solution-card">
                <div>
                  <p className="eyebrow">Locked Conversion Solution</p>
                  <h2>Unlock your full fix plan</h2>
                  <p>
                    Get the exact recommendations and copy-ready assets needed to improve this page.
                  </p>
                </div>

                <ul>
                  <li>Recommended positioning</li>
                  <li>Hero rewrite</li>
                  <li>CTA fixes</li>
                  <li>Trust & proof fixes</li>
                  <li>Pricing / offer fixes</li>
                  <li>7-day action plan</li>
                  <li>Product Hunt / Reddit follow-up copy</li>
                </ul>

                <button className="cta" type="button" onClick={unlockConversionSolution}>
                  Unlock Conversion Solution
                </button>
              </section>
            </section>
          ) : reportV2 ? (
            <V2Report report={reportV2} />
          ) : (
            <FormattedTextReport text={report} />
          )}
        </section>
      </div>
    
      <div className="report-bottom-help">
        <strong>Need help?</strong>
        <span>
          If your diagnosis or paid solution cannot be generated or downloaded, <a href="/support">contact support</a> with your PayPal order ID.
        </span>
      </div>

    </main>
  );
}
