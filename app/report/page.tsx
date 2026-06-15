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
import type { AuditInput } from "../../lib/types";
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



function slugifyFilePart(value: string) {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    || "landing-page";
}

function conversionGoalLabel(goal?: string) {
  const labels: Record<string, string> = {
    signups: "Get more signups",
    paid_users: "Get more paid users",
    demo_calls: "Get more demo calls",
    launch_conversion: "Improve Product Hunt / Reddit launch conversion"
  };

  return goal ? labels[goal] || goal : "Not specified";
}

function solutionTitle(input: AuditInput | null) {
  return input?.tier === "pro" ? "Pro Conversion Solution" : "Basic Conversion Solution";
}

function buildReportBaseName(
  reportMode: "diagnosis" | "solution",
  input: AuditInput | null,
  reportV2: AuditReportV2 | null
) {
  const kind = reportMode === "diagnosis" ? "Free-Diagnosis" : input?.tier === "pro" ? "Pro-Solution" : "Basic-Solution";
  const rawSource = input?.url || reportV2?.meta?.pageUrl || input?.product || "landing-page";
  const source = slugifyFilePart(rawSource);
  const date = new Date().toISOString().slice(0, 10);

  return `AIConversionClinic-${kind}-${source}-${date}`;
}

function normalizeExportText(text: string) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .trim();
}


function stripInlineMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s*/, "")
    .trim();
}

function scrubUnsafeExportText(text: string) {
  let output = text;

  output = output.replace(/\b(HubSpot|Mailchimp|Zapier|AdEspresso|Hootsuite|Salesforce|Slack|Stripe|Shopify)\b/gi, "verified customer");
  output = output.replace(/\b\d+(?:\.\d+)?\s*(?:-|–|—)\s*\d+(?:\.\d+)?%\s*(better|lift|increase|improvement|conversion)?/gi, "a verified performance result if available");
  output = output.replace(/\b\d+(?:\.\d+)?%\s*(?:to|→|-|–|—)\s*\d+(?:\.\d+)?%/gi, "a verified performance result if available");
  output = output.replace(/\b\d+(?:\.\d+)?x\b/gi, "a verified performance result if available");
  output = output.replace(/\b\d+%\+?\s+of\s+visitors\b/gi, "many visitors");
  output = output.replace(/\b(or it'?s free|or you do not pay|or you don't pay|you don’t pay|first month free|pay only after|pay only when|charge only when|refund 100%|100% refund|100% satisfaction|money[- ]back guarantee|performance guarantee|work for free until)\b[^.\n]*/gi, "your actual support or refund policy if available");
  output = output.replace(/\btrusted by\s+\d+\+?[^.\n]*/gi, "trusted by verified customer proof if available");
  output = output.replace(/\bused by\s+[^.\n]*\d+\+?[^.\n]*/gi, "used by verified customer proof if available");
  output = output.replace(/\$X,XXX|\$\d[\d,]*(?:\.\d{2})?/g, "[your actual price]");
  output = output.replace(/\bsales machine\b/gi, "clearer conversion path");
  output = output.replace(/\bproven system\b/gi, "structured conversion process");
  output = output.replace(/\bproven principles\b/gi, "conversion best practices");

  return output;
}

function prepareExportLines(content: string) {
  const lines: string[] = [];

  for (const raw of normalizeExportText(content).split(/\r?\n/)) {
    let line = raw.trim();

    if (!line) {
      lines.push("");
      continue;
    }

    if (/^\|[\s:|\\-]+\|?$/.test(line)) {
      continue;
    }

    if (line.startsWith("|") && line.includes("|")) {
      const cells = line
        .split("|")
        .map((cell) => stripInlineMarkdown(cell.trim()))
        .filter(Boolean);

      if (cells.length > 0) {
        lines.push(`- ${cells.join(" - ")}`);
      }

      continue;
    }

    line = stripInlineMarkdown(line);
    lines.push(line);
  }

  return lines;
}

function buildDiagnosisExportText(reportV2: AuditReportV2 | null, input: AuditInput | null) {
  const lines: string[] = [
    "# Free Conversion Diagnosis",
    "",
    `Page URL: ${input?.url || reportV2?.meta?.pageUrl || "Not provided"}`,
    `Product / service: ${input?.product || reportV2?.meta?.product || "Not provided"}`,
    `Target customer: ${input?.audience || reportV2?.meta?.targetAudience || "Not provided"}`,
    `Conversion goal: ${conversionGoalLabel(input?.conversionGoal)}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    ""
  ];

  if (!reportV2) {
    lines.push(
      "## Diagnosis unavailable",
      "No structured diagnosis data is available. Please run the diagnosis again."
    );

    return lines.join("\n");
  }

  lines.push(
    "## Conversion Score",
    `${safeScore(reportV2.executiveSummary.overallScore)} / 100`,
    "",
    "## One-Sentence Diagnosis",
    reportV2.executiveSummary.oneSentenceDiagnosis,
    "",
    "## Top Conversion Blockers"
  );

  for (const [index, leak] of reportV2.topLeaks.slice(0, 3).entries()) {
    lines.push(
      `${index + 1}. ${leak.title} (${impactLabels[leak.impact] || leak.impact})`,
      `Why it hurts: ${leak.whyItHurts}`,
      `Area to fix: ${leak.whatToChange}`,
      ""
    );
  }

  lines.push(
    "## Solution Preview",
    "Unlock the full Conversion Solution to get:",
    "- Recommended positioning",
    "- Hero rewrite",
    "- CTA fixes",
    "- Trust & proof fixes",
    "- Pricing / offer fixes",
    "- 7-day action plan",
    "- Product Hunt / Reddit follow-up copy",
    "",
    "## Important Note",
    "This free diagnosis is a preliminary strategy review based on the information provided. It identifies likely conversion blockers, but does not include the full fix plan. Recommendations should be validated with page analytics, customer feedback, and A/B testing."
  );

  return lines.join("\n");
}

function buildSolutionExportText(report: string, input: AuditInput | null) {
  const cleaned = scrubUnsafeExportText(report || "");
  const rawLines = prepareExportLines(cleaned);
  const contentLines = rawLines[0]?.startsWith("# ")
    ? rawLines.slice(1)
    : rawLines;

  return [
    `# ${solutionTitle(input)}`,
    "",
    `Page URL: ${input?.url || "Not provided"}`,
    `Product / service: ${input?.product || "Not provided"}`,
    `Target customer: ${input?.audience || "Not provided"}`,
    `Conversion goal: ${conversionGoalLabel(input?.conversionGoal)}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    ...contentLines,
    "",
    "## Important Export Note",
    "This solution is a strategy recommendation based on the information provided. Do not publish unsupported claims, fake guarantees, invented customer proof, or unverified performance numbers. Validate changes with analytics, customer feedback, and A/B testing."
  ].join("\n");
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
  const lines = prepareExportLines(content);
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
    subject: "AI Conversion Clinic Export",
    creator: "AI Conversion Clinic"
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AI Conversion Clinic", margin, 32);

  for (const line of lines) {
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
        children: prepareExportLines(text).map(buildDocxParagraph)
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
  const rawLines = prepareExportLines(text).map((line) => line.trim()).filter(Boolean);
  const lines = rawLines[0]?.startsWith("# ") ? rawLines.slice(1) : rawLines;

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
  const [input, setInput] = useState<AuditInput | null>(null);
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
    setInput(parsed.input || null);
    setDemo(Boolean(parsed.demo));
    setLocalSample(Boolean(parsed.localSample));
    setReportMode(parsed.mode === "diagnosis" ? "diagnosis" : "solution");
  }, [router]);

  const exportText = useMemo(() => {
    if (reportMode === "diagnosis") {
      return buildDiagnosisExportText(reportV2, input);
    }

    return buildSolutionExportText(report, input);
  }, [reportMode, report, reportV2, input]);

  const copyText = exportText;

  function downloadPdfReport() {
    if (!exportText) return;

    downloadPdfFile(`${buildReportBaseName(reportMode, input, reportV2)}.pdf`, exportText);
  }

  async function downloadDocxReport() {
    if (!exportText) return;

    await downloadDocxFile(`${buildReportBaseName(reportMode, input, reportV2)}.docx`, exportText);
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
          <a className="badge" href="/">Run another diagnosis</a>
        </nav>

        <section className="panel report-panel">
          {demo && !localSample && reportMode !== "diagnosis" && <div className="notice" style={{ marginBottom: 18 }}>No AI API key is configured yet, so this is a demo report. Add your production AI provider key in Vercel environment variables before selling this publicly.</div>}

          <div className="report-header">
            <div>
              <span className="eyebrow">{reportMode === "diagnosis" ? "Generated diagnosis" : "Generated solution"}</span>
              <h1>{reportMode === "diagnosis" ? "Your Conversion Diagnosis" : solutionTitle(input)}</h1>
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
