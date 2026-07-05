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
import { trackEvent } from "../lib/analytics";
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
  return input?.tier === "pro" ? "Pro Fix Plan" : "Quick Fix Report";
}

function buildReportBaseName(
  reportMode: "diagnosis" | "solution",
  input: AuditInput | null,
  reportV2: AuditReportV2 | null
) {
  const kind = reportMode === "diagnosis" ? "Free-Diagnosis" : input?.tier === "pro" ? "Pro-Fix-Plan" : "Quick-Fix-Report";
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

  output = output.replace(/\b(HubSpot|Mailchimp|Zapier|AdEspresso|Hootsuite|Salesforce|Slack|Stripe)\b/gi, "verified customer");
  output = output.replace(/\b\d+(?:\.\d+)?\s*(?:-|–|—)\s*\d+(?:\.\d+)?%\s*(better|lift|increase|improvement|conversion)?/gi, "a verified performance result");
  output = output.replace(/\b\d+(?:\.\d+)?%\s*(?:to|→|-|–|—)\s*\d+(?:\.\d+)?%/gi, "a verified performance result");
  output = output.replace(/\b\d+(?:\.\d+)?x\b/gi, "a verified performance result");
  output = output.replace(/\b\d+%\+?\s+of\s+visitors\b/gi, "many visitors");
  output = output.replace(/\b(or it'?s free|or you do not pay|or you don't pay|you don’t pay|first month free|pay only after|pay only when|charge only when|refund 100%|100% refund|100% satisfaction|money[- ]back guarantee|performance guarantee|work for free until)\b[^.\n]*/gi, "your published support or refund policy");
  output = output.replace(/\btrusted by\s+\d+\+?[^.\n]*/gi, "trusted by real customer proof");
  output = output.replace(/\bused by\s+[^.\n]*\d+\+?[^.\n]*/gi, "used by real customer proof");
  output = output.replace(/\$X,XXX/g, "the selected one-time plan price");
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

    line = stripInlineMarkdown(line).replace(/^#{1,6}\s+/, "");
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
    "## Top 3 Conversion Blockers"
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
    "Unlock the full fix plan to get:",
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


function buildDiagnosisFallbackExportText(report: string, input: AuditInput | null) {
  const cleaned = scrubUnsafeExportText(report || "");
  const rawLines = prepareExportLines(cleaned);
  const contentLines = rawLines[0]?.startsWith("# ")
    ? rawLines.slice(1)
    : rawLines;

  if (contentLines.length === 0) {
    return buildDiagnosisExportText(null, input);
  }

  return [
    "# Free Conversion Diagnosis",
    "",
    `Page URL: ${input?.url || "Not provided"}`,
    `Product / service: ${input?.product || "Not provided"}`,
    `Target customer: ${input?.audience || "Not provided"}`,
    `Conversion goal: ${conversionGoalLabel(input?.conversionGoal)}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    ...contentLines,
    "",
    "## Important Note",
    "This free diagnosis is a preliminary strategy review based on the information provided. It identifies likely conversion blockers, but does not include the full fix plan. Recommendations should be validated with page analytics, customer feedback, and A/B testing."
  ].join("\n");
}


function normalizeExportMarkdownSpacing(content: string) {
  let text = content
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\uFFFE/g, "\n")
    .replace(/^\s*#+\s*$/gm, "")
    .replace(/\|\s*\|/g, "|\n|")
    .replace(/([^\n])(?=#{1,6}\s+)/g, "$1\n\n")
    .replace(/(#{1,6}\s+[^|\n]{1,90})\|/g, "$1\n|")
    .replace(/:\s*(?=\|)/g, ":\n")
    .replace(/\. the \$29 Pro Fix Plan/g, ". The $29 Pro Fix Plan")
    .replace(/""\s*(?=After payment confirmation)/g, "\"\n\"")
    .replace(/"(\s*\n\s*)After payment confirmation/g, "\"\nAfter payment confirmation");

  const sectionTitles = [
    "Executive Diagnosis",
    "Conversion Score Breakdown",
    "Top 3 Paid Conversion Leaks",
    "Priority Fix Roadmap",
    "Hero & Above-the-Fold Rewrite",
    "CTA & Checkout Unlock Fixes",
    "Trust & Payment Reassurance",
    "Objection Handling FAQ",
    "A/B Testing Plan",
    "7-Day Implementation Plan",
    "14-Day Follow-up Checklist",
    "Important Note",
    "Important Export Note"
  ];

  for (const title of sectionTitles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`([^\\n])(?=${escaped})`, "g"), "$1\n\n");
    text = text.replace(new RegExp(`(${escaped})(?=\\S)`, "g"), "$1\n");
  }


  const quickSectionTitles = [
    "Page Copy Recommendations",
    "Free vs Quick Fix Comparison",
    "Trust & Proof Guidance",
    "7-Day Action Plan"
  ];

  for (const title of quickSectionTitles) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`([^\\n])(?=${escaped})`, "g"), "$1\n\n");
    text = text.replace(new RegExp(`(${escaped})(?=\\S)`, "g"), "$1\n");
  }

  const blockStarts = [
    "The page communicates",
    "The strongest opportunity",
    "Page reviewed:",
    "Product or service:",
    "Target audience:",
    "Primary conversion goal:",
    "Recommended headline:",
    "Recommended subheadline:",
    "Primary CTA:",
    "CTA microcopy:",
    "Alternate headline variants:",
    "Primary unlock CTA:",
    "Secondary reassurance line:",
    "Button text:",
    "What the user sees after clicking:",
    "What happens after payment:",
    "Add these elements near",
    "Sample preview format:",
    "Issue:",
    "Suggested rewrite:",
    "Reason:",
    "All recommendations in this Pro Fix Plan",
    "This solution is a strategy recommendation"
  ];

  for (const phrase of blockStarts) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`([^\\n])(?=${escaped})`, "g"), "$1\n");
  }

  const labelBreakAfter = [
    "Recommended headline:",
    "Recommended subheadline:",
    "Primary CTA:",
    "CTA microcopy:",
    "Alternate headline variants:",
    "Primary unlock CTA:",
    "Secondary reassurance line:",
    "Button text:",
    "What the user sees after clicking:",
    "What happens after payment:",
    "Sample preview format:",
    "Issue:",
    "Suggested rewrite:",
    "Reason:",
    "Exact copy or UI change:"
  ];

  for (const label of labelBreakAfter) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`(${escaped})([^\\n])`, "g"), "$1\n$2");
  }


  const quickLabelBreakAfter = [
    "Paid CTA",
    "CTA support copy",
    "Payment reassurance copy",
    "What happens after payment"
  ];

  for (const label of quickLabelBreakAfter) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`(${escaped})(?=\\S)`, "g"), "$1\n");
  }

  text = text
    .replace(/(7-Day Implementation Plan)(?=Day\s+\d+:)/g, "$1\n")
    .replace(/(14-Day Follow-up Checklist)\s*-\s*/g, "$1\n- ")
    .replace(/(Important Note)(?=All recommendations)/g, "$1\n")
    .replace(/([.!?"])-\s+/g, "$1\n- ")
    .replace(/([^\n])-\s+(Why it hurts paid conversion:|What to change:|Priority:|Validation metric:|Page location:|Implementation effort:|Expected impact level:|Exact copy or UI change:|Hypothesis:|Control:|Variant:|Metric:|Minimum data note:)/g, "$1\n- $2")
    .replace(/([:\."])\s*-\s+(Secure PayPal checkout\.|One-time payment of \$29\.|Link to the published refund\/support policy\.|Link to an anonymized sample Pro Fix Plan\.|Clear explanation:|Review |Check |Compare |Confirm |Test |Verify |Use )/g, "$1\n- $2")
    .replace(/\n-\s*\n(Issue:|Suggested rewrite:|Reason:)/g, "\n- $1")
    .replace(/([.!?])(?=Day\s+\d+:)/g, "$1\n")
    .replace(/([a-z\)])(?=\d+\.\s+[A-Z])/g, "$1\n")
    .replace(/\?(?=(The free diagnosis|The \$9|Yes\.|The Pro Fix Plan|After payment confirmation|The plan is))/g, "?\n")
    .replace(/([.!?"])(?=(The strongest opportunity|After payment confirmation|Sample preview format:|Page reviewed:))/g, "$1\n")
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, "")
    .replace(/^\s*\|[-:\s|]+$/gm, "")
    .replace(/([.!?"])\s*\|\s*$/gm, "$1")
    .replace(/(Clear explanation:\s*)"/g, "$1")
    .replace(/^\s*"\s*$/gm, "")
    .replace(/"\s*\n(After payment confirmation)/g, "\n$1")
    .replace(/(full fix plan\.)"/g, "$1")
    .replace(/(Fix\s+\d+:[^\n]+?)-\s+(Problem:|Recommended fix:|Implementation:|Validation metric:)/g, "$1\n- $2")
    .replace(/([.!?"])-\s+(Recommended fix:|Implementation:|Validation metric:)/g, "$1\n- $2")
    .replace(/(Trust & Proof Guidance)-\s+/g, "$1\n- ")
    .replace(/(7-Day Action Plan)(?=Day\s+\d+:)/g, "$1\n")
    .replace(/(Page Copy Recommendations)(?=(Paid CTA|CTA support copy|Payment reassurance copy|What happens after payment))/g, "$1\n")
    .replace(/(Free vs Quick Fix Comparison)(?=Feature\s+\|)/g, "$1\n")
    .replace(/(Overview)(?=The page)/g, "$1\n")
    .replace(/(Executive Diagnosis)(?=The page)/g, "$1\n")
    .replace(/(Detected page type:[^\n]+)(?=Conversion Score Breakdown)/g, "$1\n\n")
    .replace(/(Fix\s+\d+:[^\n]+)-\s+(Why it hurts conversion:)/g, "$1\n- $2")
    .replace(/(Hero rewrite)(?=Headline:)/g, "$1\n")
    .replace(/(CTA microcopy)(?=See how|Clarify)/g, "$1\n")
    .replace(/(Trust & Objection Handling)(?=Add these)/g, "$1\n")
    .replace(/(clicking\?)(?=They should)/g, "$1\n")
    .replace(/(CTA\?)(?=Use proof)/g, "$1\n")
    .replace(/(first\?)(?=Test the primary)/g, "$1\n")
    .replace(/(Primary conversion goal:[^\n]+)(Detected page type:)/g, "$1\n\n$2")
    .replace(/(Detected page type:[^\n]+)(Conversion Score Breakdown)/g, "$1\n\n$2")
    .replace(/(next step\.)(This (?:Pro Fix Plan|Quick Fix Report))/g, "$1\n\n$2")
    .replace(/(Hero rewrite)(?=Headline:)/g, "$1\n")
    .replace(/(Headline:)([^\n])/g, "$1\n$2")
    .replace(/(Subheadline:)([^\n])/g, "$1\n$2")
    .replace(/(Primary CTA:)([^\n])/g, "$1\n$2")
    .replace(/(CTA microcopy)(?=See how|Clarify)/g, "$1\n")
    .replace(/(CTA support copy)(?=Make the next step)/g, "$1\n")
    .replace(/(Secondary CTA)(?=Keep lower)/g, "$1\n")
    .replace(/(Trust & Objection Handling)(?=Add these)/g, "$1\n")
    .replace(/(action:)-\s+/g, "$1\n- ")
    .replace(/(committing\.)(Clarify what happens)/g, "$1\n$2")
    .replace(/\*\*/g, "")
    .replace(/(Headline:\n[^\n.?!]+[.?!])(?=Subheadline:)/g, "$1\n\n")
    .replace(/(Subheadline:\n[^\n.?!]+[.?!])(?=Primary CTA:)/g, "$1\n\n")
    .replace(/(Primary CTA)(?=Start Free|Book a Product Demo|Add to Cart|Subscribe|Book a Fit Call|Start Learning|Take the next step)/g, "$1\n")
    .replace(/(Secondary CTA)(?=Keep lower)/g, "$1\n")
    .replace(/(Day\s+\d+:[^\n]+)-\s+(Page area:)/g, "$1\n- $2")
    .replace(/(Day\s+\d+:[^\n]+)(?=- Page area:)/g, "$1\n")
    .replace(/(click\.)(Explain why)/g, "$1\n$2")
    .replace(/(users\.)(This (?:Pro Fix Plan|Quick Fix Report))/g, "$1\n\n$2")
    .replace(/(Product value stack)(?=Why shoppers)/g, "$1\n")
    .replace(/(Why shoppers choose this:)(?=Breathable|Clear|Specific)/g, "$1\n")
    .replace(/(sleep\.)(A crisp|Easy returns)/g, "$1\n$2")
    .replace(/(use\.)(Easy returns)/g, "$1\n$2")
    .replace(/(Add-to-cart reassurance copy)(?=Add to Cart)/g, "$1\n")
    .replace(/(Add to Cart)(?=Secure checkout)/g, "$1\n")
    .replace(/(wrong\.)(Place shipping)/g, "$1\n$2")
    .replace(/(Review proof block)(?=Loved by)/g, "$1\n")
    .replace(/(bedding\.)(Show star)/g, "$1\n$2")
    .replace(/purchase confidence\.(This (?:Pro Fix Plan|Quick Fix Report))/g, "purchase confidence.\n\n$1")
    .replace(/(Product value stack\nWhy shoppers choose this:\nBreathable premium cotton for comfortable everyday sleep\.)\s*,\s*classic/g, "$1\nA crisp, classic")
    .replace(/(A crisp, classic feel designed for year-round use\.)\s*and clear/g, "$1\nEasy returns and clear")
    .replace(/(Secure checkout\. Clear returns\. Support available if anything is wrong\.)\s*,\s*returns/g, "$1\nPlace shipping, returns")
    .replace(/(Loved by shoppers looking for breathable, comfortable\s*bedding\.)\s*rating/g, "$1\nShow star rating")
    .replace(/explains details/g, "sizing details")
    .replace(/returns, explains, shipping/g, "returns, sizing, shipping")
    .replace(/(worthwhile\.)(This (?:Pro Fix Plan|Quick Fix Report))/g, "$1\n\n$2")
    .replace(/(Booking CTA rewrite)(?=Book a Fit Call)/g, "$1\n")
    .replace(/(Book a Fit Call)(?=See if)/g, "$1\n")
    .replace(/(team\.)(Get a clear next-step)/g, "$1\n$2")
    .replace(/(Process copy\s*1\. Share your current situation\.)(2\. Review)/g, "$1\n$2")
    .replace(/(priorities\.)(3\. Get the recommended)/g, "$1\n$2")
    .replace(/(Qualification copy)(?=Best for)/g, "$1\n")
    .replace(/(execution\.)(Not ideal)/g, "$1\n$2")
    .replace(/(See if this is right for your team\.)\s*recommendation before committing\./g, "$1\nGet a clear next-step recommendation before committing.")
    .replace(/(2\. Review fit, scope, and priorities\.)\s*next step\./g, "$1\n3. Get the recommended next step.")
    .replace(/(Best for teams that need ongoing support and clear\s*execution\.)\s*if you only/g, "$1\nNot ideal if you only")
    .replace(/(inbox\.)(This (?:Pro Fix Plan|Quick Fix Report))/g, "$1\n\n$2")
    .replace(/(Signup block rewrite)(?=Get one practical)/g, "$1\n")
    .replace(/(week\.)(Join readers)/g, "$1\n$2")
    .replace(/(decisions\.)(No spam)/g, "$1\n$2")
    .replace(/(Content preview)(?=Recent topics:)/g, "$1\n")
    .replace(/(Recent topics:)(?=Practical)/g, "$1\n")
    .replace(/(frameworks\.)(Examples from)/g, "$1\n$2")
    .replace(/(decisions\.)(Actionable)/g, "$1\n$2")
    .replace(/(Signup reassurance)(?=Sent on)/g, "$1\n")
    .replace(/(cadence\.)(Built for)/g, "$1\n$2")
    .replace(/(updates\.)(Unsubscribe anytime)/g, "$1\n$2")
    .replace(/(Get one practical insight in your inbox each week\.)\s*who use this newsletter/g, "$1\nJoin readers who use this newsletter")
    .replace(/(product, growth, or career decisions\.)\s*\.\s*Unsubscribe anytime\./g, "$1\nNo spam. Unsubscribe anytime.")
    .replace(/(Practical frameworks\.)\s*real decisions\./g, "$1\nExamples from real decisions.")
    .replace(/(Examples from real decisions\.)\s*takeaways\./g, "$1\nActionable takeaways.")
    .replace(/(Sent on a predictable cadence\.)\s*readers who want practical advice/g, "$1\nBuilt for readers who want practical advice")
    .replace(/(not generic updates\.)\s*\./g, "$1\nUnsubscribe anytime.")
    .replace(/(CTA support copy)\s*,\s*and FAQ/g, "$1, and FAQ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function buildSolutionExportText(report: string, input: AuditInput | null) {
  const cleaned = normalizeExportMarkdownSpacing(scrubUnsafeExportText(report || ""));
  const rawLines = cleaned.split("\n").map((line) => line.trimEnd());
  const contentLines = rawLines[0]?.trim().startsWith("# ")
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
  const lines = normalizeExportMarkdownSpacing(content).split("\n");
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

  function cleanInlineMarkdown(value: string) {
    return value
      .replace(/^#+\s*$/, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function writeWrapped(
    raw: string,
    options?: {
      size?: number;
      bold?: boolean;
      indent?: number;
      gap?: number;
      before?: number;
    }
  ) {
    const text = cleanInlineMarkdown(raw);
    if (!text) return;

    const size = options?.size ?? 10;
    const indent = options?.indent ?? 0;
    const gap = options?.gap ?? 8;
    const before = options?.before ?? 0;
    const lineHeight = size + 5;
    const availableWidth = Math.max(80, maxWidth - indent);

    y += before;

    const wrapped = doc.splitTextToSize(text, availableWidth) as string[];
    addPageIfNeeded(wrapped.length * lineHeight + gap);

    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(size);

    for (const wrappedLine of wrapped) {
      doc.text(wrappedLine, margin + indent, y);
      y += lineHeight;
    }

    y += gap;
  }

  function writeHeading(line: string) {
    const level = line.match(/^#{1,6}/)?.[0].length || 1;
    const text = cleanInlineMarkdown(line.replace(/^#{1,6}\s+/, ""));

    if (!text) return;

    if (level === 1) {
      writeWrapped(text, { size: 18, bold: true, gap: 16, before: y > 70 ? 8 : 0 });
      return;
    }

    if (level === 2) {
      writeWrapped(text, { size: 14, bold: true, gap: 11, before: 12 });
      return;
    }

    writeWrapped(text, { size: 11, bold: true, gap: 8, before: 8 });
  }

  function isMarkdownTableDivider(line: string) {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
  }

  function writeTableLine(line: string) {
    if (isMarkdownTableDivider(line)) return;

    const cells = line
      .split("|")
      .map((cell) => cleanInlineMarkdown(cell))
      .filter(Boolean);

    if (cells.length === 0) return;

    writeWrapped(cells.join("  |  "), {
      size: 8,
      bold: /^feature|area|item/i.test(cells[0]),
      gap: 5
    });
  }

  doc.setProperties({
    title: filename.replace(/\.pdf$/i, ""),
    subject: "AI Conversion Clinic report",
    creator: "AI Conversion Clinic"
  });

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || /^#+$/.test(line)) {
      y += 7;
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      writeHeading(line);
      continue;
    }

    if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line) || /^\|[-:\s|]+$/.test(line)) {
      continue;
    }

    if (line.includes("|") && line.split("|").length >= 3) {
      writeTableLine(line);
      continue;
    }

    if (/^[-•]\s+/.test(line)) {
      writeWrapped(`- ${line.replace(/^[-•]\s+/, "")}`, {
        size: 10,
        indent: 14,
        gap: 6
      });
      continue;
    }

    if (/^Day\s+\d+:/i.test(line)) {
      writeWrapped(line, { size: 10, bold: true, gap: 7 });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      writeWrapped(line, { size: 10, indent: 12, gap: 6 });
      continue;
    }

    writeWrapped(line, { size: 10, gap: 8 });
  }

  doc.save(filename);
}
function buildDocxParagraph(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return new Paragraph({ text: "" });
  }

  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];

    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: level <= 1 ? 32 : level === 2 ? 26 : 22
        })
      ],
      spacing: { before: level <= 2 ? 280 : 180, after: 160 }
    });
  }

  if (/^[-•]\s+/.test(trimmed)) {
    return new Paragraph({
      children: [new TextRun({ text: trimmed.replace(/^[-•]\s+/, "• ") })],
      spacing: { after: 100 },
      indent: { left: 360 }
    });
  }

  if (/^\|.*\|$/.test(trimmed)) {
    return new Paragraph({
      children: [new TextRun({ text: trimmed, size: 18 })],
      spacing: { after: 80 }
    });
  }

  return new Paragraph({
    children: [new TextRun({ text: trimmed })],
    spacing: { after: 120 }
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


function recommendedToolsForPageType(pageType: PageType) {
  if (pageType === "shopify_ecommerce") {
    return [
      {
        category: "Behavior analytics",
        tools: "Microsoft Clarity, Hotjar",
        why: "Use heatmaps and recordings to see where shoppers hesitate, scroll, or abandon."
      },
      {
        category: "Reviews and proof",
        tools: "Loox, Judge.me, Yotpo",
        why: "Add stronger customer proof near product decisions and CTA sections."
      },
      {
        category: "Email recovery",
        tools: "Klaviyo, Mailchimp",
        why: "Recover abandoned carts and follow up with visitors who do not buy immediately."
      }
    ];
  }

  if (pageType === "saas" || pageType === "software_app") {
    return [
      {
        category: "Product analytics",
        tools: "PostHog, Mixpanel",
        why: "Track signup, activation, demo, and trial-to-paid behavior."
      },
      {
        category: "Session recordings",
        tools: "Microsoft Clarity, Hotjar",
        why: "See where visitors hesitate before signing up or booking a demo."
      },
      {
        category: "CRM and follow-up",
        tools: "HubSpot, Pipedrive",
        why: "Track demo requests, lead quality, and sales follow-up speed."
      }
    ];
  }

  if (pageType === "service_lead_gen" || pageType === "agency_consulting") {
    return [
      {
        category: "Lead capture",
        tools: "Tally, Typeform, Fillout",
        why: "Make forms easier to complete and reduce lead submission friction."
      },
      {
        category: "CRM",
        tools: "HubSpot, Pipedrive",
        why: "Track inbound leads, follow-up speed, and booked consultation outcomes."
      },
      {
        category: "Behavior analytics",
        tools: "Microsoft Clarity, Hotjar",
        why: "Identify where visitors drop off before submitting the form."
      }
    ];
  }

  if (pageType === "course_coaching") {
    return [
      {
        category: "Checkout and landing pages",
        tools: "ConvertKit, Kajabi, Teachable",
        why: "Improve offer presentation, email capture, and purchase flow."
      },
      {
        category: "Forms and quizzes",
        tools: "Tally, Typeform, Fillout",
        why: "Use lower-friction qualification steps before asking for a purchase or call."
      },
      {
        category: "Behavior analytics",
        tools: "Microsoft Clarity, Hotjar",
        why: "Find hesitation points around pricing, proof, and CTA sections."
      }
    ];
  }

  return [
    {
      category: "Behavior analytics",
      tools: "Microsoft Clarity, Hotjar",
      why: "See where visitors scroll, hesitate, and abandon the page."
    },
    {
      category: "Forms",
      tools: "Tally, Typeform, Fillout",
      why: "Reduce form friction and make the next step easier to complete."
    },
    {
      category: "A/B testing",
      tools: "VWO, Convert",
      why: "Test revised hero, CTA, and proof sections instead of relying on opinion."
    }
  ];
}

function V2Report({ report }: { report: AuditReportV2 }) {
  const overallScore = safeScore(report.executiveSummary.overallScore);
  const overallLevel = scoreLevel(overallScore);
  const isPro = report.meta.tier === "pro";
  const tierLabel = isPro ? "Pro Fix Plan" : "Quick Fix Report";
  const visibleRewrites = isPro ? report.rewrites.slice(0, 5) : report.rewrites.slice(0, 3);
  const visibleQuickWins = report.priorityFixes.quickWins.slice(0, 3);
  const visibleSevenDayPlan = report.sevenDayPlan.slice(0, 7);
  const recommendedTools = recommendedToolsForPageType(report.meta.pageType);

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

      <section className="report-section">
        <div className="section-heading compact">
          <span className="eyebrow">Recommended tools</span>
          <h2>Tools that support this conversion fix</h2>
          <p>
            These are not random software suggestions. They are tools that can help you verify,
            implement, or track the fixes recommended in this report.
          </p>
        </div>

        <div className="fix-list">
          {recommendedTools.map((item) => (
            <article className="fix-card" key={item.category}>
              <strong>{item.category}</strong>
              <p>{item.tools}</p>
              <b>{item.why}</b>
            </article>
          ))}
        </div>
      </section>

      <div className="notice">{report.disclaimer}</div>
    </div>
  );
}



function DiagnosisCardReport({
  reportV2,
  input,
  fallbackText
}: {
  reportV2: AuditReportV2 | null;
  input: AuditInput | null;
  fallbackText: string;
}) {
  if (!reportV2) {
    const cleaned = fallbackText.replace(/^#\s+Free Conversion Diagnosis\s*\n+/, "");
    const scoreMatch = cleaned.match(/(?:Conversion Score\s*\n+)?(\d{1,3})\s*\/\s*100/i);
    const score = scoreMatch ? safeScore(Number(scoreMatch[1])) : 0;
    const diagnosisMatch = cleaned.match(/One-Sentence Diagnosis\s*\n+([\s\S]*?)(?=\n+Top\s+3\s+Conversion Blockers|\n+Top Conversion Blockers|\n+Solution Preview|\n+Important Note|$)/i);
    const oneSentenceDiagnosis = diagnosisMatch?.[1]?.trim() || "The page has likely conversion blockers that should be clarified before asking visitors to act.";
    const blockerSection = cleaned.match(/Top\s+3\s+Conversion Blockers\s*\n+([\s\S]*?)(?=\n+Solution Preview|\n+Important Note|$)/i)?.[1] || "";
    const parsedLeaks = Array.from(blockerSection.matchAll(/(?:^|\n)(\d+)\.\s*([^\n]+)\n([\s\S]*?)(?=\n\d+\.\s+[^\n]+|\n*$)/g))
      .slice(0, 3)
      .map((match) => {
        const body = match[3] || "";
        const severity = body.match(/Severity:\s*([^\n]+)/i)?.[1]?.trim() || "Needs review";
        const why = body.match(/Why it hurts conversion:\s*([\s\S]*?)(?=\n\s*[-•]\s*Area that needs attention:|\n\s*Area that needs attention:|$)/i)?.[1]?.replace(/^[-•]\s*/, "").trim() || body.replace(/\n+/g, " ").trim();
        const area = body.match(/Area that needs attention:\s*([\s\S]*?)$/i)?.[1]?.replace(/^[-•]\s*/, "").trim() || "Improve the section closest to the primary conversion action.";

        return {
          title: match[2].trim(),
          severity,
          why,
          area
        };
      });

    const leaks = parsedLeaks.length > 0
      ? parsedLeaks
      : [
          {
            title: "The page needs a clearer conversion path",
            severity: "Needs review",
            why: oneSentenceDiagnosis,
            area: "Hero copy, proof, CTA, and surrounding context."
          }
        ];

    return (
      <div className="diagnosis-preview-report">
        <div className="diagnosis-score-card">
          <span className="diagnosis-score-label">Overall Score</span>
          <strong className="diagnosis-score-value">{score} / 100</strong>
          <p>
            Diagnosis based on the submitted page, product, target customer, and conversion goal.
          </p>
        </div>

        <div className="diagnosis-card-grid">
          <article className="diagnosis-mini-card">
            <h2>One-Sentence Diagnosis</h2>
            <p>{oneSentenceDiagnosis}</p>
          </article>

          <article className="diagnosis-mini-card">
            <h2>Top Conversion Leak</h2>
            <p>{leaks[0]?.title || "The page needs a clearer conversion path."}</p>
          </article>
        </div>

        <section className="diagnosis-section">
          <h2>Top 3 Conversion Blockers</h2>
          <div className="diagnosis-leak-list">
            {leaks.map((leak, index) => (
              <article className="diagnosis-leak-card" key={`${leak.title}-${index}`}>
                <h3>{index + 1}. {leak.title}</h3>
                <p className="diagnosis-leak-meta">Severity: {leak.severity}</p>
                <p><strong>Why it hurts conversion:</strong> {leak.why}</p>
                <p><strong>Area that needs attention:</strong> {leak.area}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="diagnosis-action-strip">
          <strong>Solution Preview:</strong>{" "}
          Unlock the full fix plan to get copy-ready recommendations, CTA fixes, trust and proof guidance, and a practical 7-day action plan.
        </div>

        <div className="diagnosis-details-grid" aria-label="Diagnosis details">
          <p><strong>Page URL:</strong> {input?.url || "Not provided"}</p>
          <p><strong>Product / service:</strong> {input?.product || "Not provided"}</p>
          <p><strong>Target customer:</strong> {input?.audience || "Not provided"}</p>
          <p><strong>Conversion goal:</strong> {conversionGoalLabel(input?.conversionGoal)}</p>
        </div>
      </div>
    );
  }

  const score = safeScore(reportV2.executiveSummary.overallScore);
  const topLeaks = reportV2.topLeaks.slice(0, 3);
  const primaryLeak = topLeaks[0];

  return (
    <div className="diagnosis-preview-report">
      <div className="diagnosis-score-card">
        <span className="diagnosis-score-label">Overall Score</span>
        <strong className="diagnosis-score-value">{score} / 100</strong>
        <p>{input?.product || reportV2.meta.product || "Landing page"}</p>
      </div>

      <div className="diagnosis-card-grid">
        <article className="diagnosis-mini-card">
          <h2>One-Sentence Diagnosis</h2>
          <p>{reportV2.executiveSummary.oneSentenceDiagnosis}</p>
        </article>
        <article className="diagnosis-mini-card">
          <h2>Top Conversion Leak</h2>
          <p>{primaryLeak ? primaryLeak.title : "The page needs a clearer conversion path."}</p>
        </article>
      </div>

      <section className="diagnosis-section">
        <h2>Top 3 Conversion Blockers</h2>
        <div className="diagnosis-leak-list">
          {topLeaks.map((leak, index) => (
            <article className="diagnosis-leak-card" key={`${leak.title}-${index}`}>
              <h3>{index + 1}. {leak.title}</h3>
              <p className="diagnosis-leak-meta">Severity: {impactLabels[leak.impact] || leak.impact}</p>
              <p><strong>Why it hurts conversion:</strong> {leak.whyItHurts}</p>
              <p><strong>Area that needs attention:</strong> {leak.whatToChange}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="diagnosis-action-strip">
        <strong>Solution Preview:</strong> Unlock the full fix plan to get copy-ready recommendations, CTA fixes, trust and proof guidance, and a practical 7-day action plan.
      </div>

      <div className="diagnosis-details-grid" aria-label="Diagnosis details">
        <p><strong>Page URL:</strong> {input?.url || reportV2.meta.pageUrl || "Not provided"}</p>
        <p><strong>Product / service:</strong> {input?.product || reportV2.meta.product || "Not provided"}</p>
        <p><strong>Target customer:</strong> {input?.audience || reportV2.meta.targetAudience || "Not provided"}</p>
        <p><strong>Conversion goal:</strong> {conversionGoalLabel(input?.conversionGoal)}</p>
      </div>
    </div>
  );
}

function FormattedTextReport({ text }: { text: string }) {
  const normalizedText = normalizeExportMarkdownSpacing(text || "");
  const rawLines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#+$/.test(line))
    .filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line));

  const lines = rawLines[0]?.startsWith("# ") ? rawLines.slice(1) : rawLines;

  return (
    <article className="formatted-report">
      {lines.map((line, index) => {
        if (/^#{1,6}\s+/.test(line)) {
          const level = line.match(/^#{1,6}/)?.[0].length || 1;
          const headingText = line.replace(/^#{1,6}\s+/, "");

          if (level <= 2) {
            return <h3 key={index}>{headingText}</h3>;
          }

          return <h4 key={index}>{headingText}</h4>;
        }

        if (line.includes("|") && line.split("|").length >= 3) {
          const cells = line
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean);

          if (cells.length === 0) return null;

          return (
            <p className="formatted-table-row" key={index}>
              {cells.map((cell, cellIndex) => (
                <span key={`${index}-${cellIndex}`}>{cell}</span>
              ))}
            </p>
          );
        }

        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <p className="formatted-bullet" key={index}>{line.replace(/^[-•]\s+/, "")}</p>;
        }

        if (/^Day\s+\d+:/i.test(line)) {
          return <p className="formatted-day" key={index}>{line}</p>;
        }

        if (/^\d+\.\s+/.test(line)) {
          return <p className="formatted-numbered" key={index}>{line}</p>;
        }

        if (/^[A-Z][A-Za-z &/+-]+:$/.test(line)) {
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
    const nextReportMode = parsed.mode === "diagnosis" ? "diagnosis" : "solution";
    setReportMode(nextReportMode);

    if (nextReportMode === "diagnosis") {
      const diagnosisTrackingSource = parsed as {
        diagnosisId?: string;
        generatedAt?: string;
      };
      const diagnosisTrackingKey = `diagnosis-success-${diagnosisTrackingSource.diagnosisId || diagnosisTrackingSource.generatedAt || "latest"}`;

      if (sessionStorage.getItem(diagnosisTrackingKey) !== "true") {
        sessionStorage.setItem(diagnosisTrackingKey, "true");
        trackEvent("diagnosis_success", {
          source_path: "/report",
          report_mode: nextReportMode
        });
      }
    }
  }, [router]);

  const exportText = useMemo(() => {
    if (reportMode === "diagnosis") {
      if (reportV2) return buildDiagnosisExportText(reportV2, input);
      if (report.trim()) return buildDiagnosisFallbackExportText(report, input);
      return buildDiagnosisExportText(null, input);
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

    trackEvent("checkout_click", {
      source_path: "/report",
      report_mode: reportMode,
      unlock_source: reportV2 ? "structured_report_unlock" : "fallback_report_unlock"
    });
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
              <span className="eyebrow">{reportMode === "diagnosis" ? "Generated diagnosis" : "Generated fix plan"}</span>
              <h1>{reportMode === "diagnosis" ? "Free Conversion Diagnosis" : solutionTitle(input)}</h1>
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
<button className="cta copy-button" onClick={copyReport}>{copied ? "Copied" : reportMode === "diagnosis" ? "Copy diagnosis" : "Copy fix plan"}</button>
          </div>

          {reportMode === "diagnosis" ? (
            <DiagnosisCardReport reportV2={reportV2} input={input} fallbackText={exportText} />
          ) : reportV2 ? (
            <V2Report report={reportV2} />
          ) : (
            <FormattedTextReport text={report} />
          )}

          {reportMode === "diagnosis" ? (
            <section className="locked-solution-card fallback-unlock-card">
              <div>
                <p className="eyebrow">Locked Fix Plan</p>
                <h2>Unlock your full fix plan</h2>

                <ul className="report-trust-bar" aria-label="Payment trust signals">
                  <li>Secure PayPal checkout</li>
                  <li>Generate after payment confirmation</li>
                  <li>Sample report available</li>
                  <li>Refund policy available</li>
                </ul>

                <div className="payment-flow-card" aria-label="What happens after payment">
                  <div className="payment-flow-header">
                    <span>What happens after payment</span>
                    <strong>After payment confirmation, you can generate, view, copy, or export the full fix plan.</strong>
                  </div>

                  <ol className="payment-flow-steps">
                    <li>
                      <strong>Pay securely with PayPal</strong>
                      <span>You complete checkout through PayPal. We do not store card or bank details.</span>
                    </li>
                    <li>
                      <strong>Return to checkout automatically</strong>
                      <span>After PayPal confirms the payment, the checkout page unlocks report generation.</span>
                    </li>
                    <li>
                      <strong>Generate your full fix plan</strong>
                      <span>Your paid plan includes copy-ready recommendations, structure fixes, proof improvements, and implementation steps.</span>
                    </li>
                    <li>
                      <strong>Download or copy the report</strong>
                      <span>You can export the result or copy it into your working document.</span>
                    </li>
                    <li>
                      <strong>Support if anything fails</strong>
                      <span>If payment succeeds but generation fails, contact support with your PayPal order ID.</span>
                    </li>
                  </ol>
                </div>

                <p>
                  Get the exact recommendations and copy-ready assets needed to improve this page.
                </p>
              </div>

              <ul>
                <li>Recommended positioning</li>
                <li>Hero rewrite</li>
                <li>CTA fixes</li>
                <li>Trust & proof fixes</li>
                <li>Implementation checklist</li>
                <li>Follow-up copy ideas</li>
              </ul>

              <button className="cta" type="button" onClick={unlockConversionSolution}>
                Unlock full fix plan
              </button>
            </section>
          ) : null}
        </section>
      </div>
    
      <div className="report-bottom-help">
        <strong>Need help?</strong>
        <span>
          If your diagnosis or full fix plan cannot be generated or downloaded, <a href="/support">contact support</a> with your PayPal order ID.
        </span>
      </div>

    </main>
  );
}
