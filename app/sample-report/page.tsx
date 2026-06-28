import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sample AI Landing Page Conversion Report | AI Conversion Clinic",
  description:
    "See a sample AI-powered landing page audit with conversion score, messaging diagnosis, CTA fixes, buyer objections, rewritten copy, and a 7-day action plan.",
};

const scoreItems = [
  { label: "Messaging clarity", score: 6 },
  { label: "CTA strength", score: 5 },
  { label: "Trust proof", score: 4 },
  { label: "Objection handling", score: 5 },
  { label: "Offer clarity", score: 7 },
  { label: "Funnel friction", score: 6 },
];

const conversionLeaks = [
  {
    title: "The headline is too vague",
    current: "AI-powered workflows for modern teams",
    problem:
      "This sounds polished, but it does not tell the visitor what specific problem the product solves. Many AI SaaS products could use the same headline.",
    impact:
      "Visitors need to understand the value within a few seconds. If the headline is too broad, they are forced to scroll and interpret the offer themselves.",
  },
  {
    title: "The CTA asks for too much too early",
    current: "Book a Demo",
    problem:
      "Booking a demo is a high-friction action, especially if the visitor has not yet seen enough proof, pricing context, or use cases.",
    impact:
      "Visitors may be interested but not ready to speak to sales. The page should either offer a lower-friction next step or make the demo feel more specific and valuable.",
  },
  {
    title: "Trust proof appears too late",
    current: "Customer results appear near the bottom of the page",
    problem:
      "The page mentions customer results too late, after multiple sections of product explanation. Many visitors may never reach that point.",
    impact:
      "For a B2B SaaS landing page, trust needs to appear before or near the first CTA. Visitors need evidence before they take action.",
  },
];

const heroOptions = [
  {
    label: "Option A",
    title: "Stop losing hours to manual operations work.",
    body:
      "FlowPilot AI helps small operations teams automate recurring workflows, reduce handoff delays, and keep every task moving without adding another project manager.",
    cta: "See How FlowPilot Works",
    recommended: false,
  },
  {
    label: "Option B",
    title:
      "Automate your team’s recurring workflows without rebuilding your entire process.",
    body:
      "FlowPilot AI connects your tasks, approvals, and follow-ups into one automated workflow system for small operations teams.",
    cta: "Book a 15-Minute Workflow Review",
    recommended: true,
  },
  {
    label: "Option C",
    title: "Your team should not need five tools to keep one workflow moving.",
    body:
      "FlowPilot AI helps operations teams automate repetitive handoffs, reminders, and approvals so work does not get stuck between people, tools, and meetings.",
    cta: "Find Your Workflow Bottlenecks",
    recommended: false,
  },
];

const ctaAlternatives = [
  "Book a 15-Minute Workflow Review",
  "See How FlowPilot Works",
  "Find Your Workflow Bottlenecks",
  "Get a Workflow Automation Walkthrough",
  "See If FlowPilot Fits Your Team",
];

const trustRecommendations = [
  "Add one short customer result near the hero.",
  "Add customer logos before the second CTA.",
  "Add a testimonial focused on the pain point.",
  "Add a simple workflow before/after visual.",
  "Add integration proof near the CTA.",
];

const buyerObjections = [
  "Will this replace our current tools?",
  "How hard is setup?",
  "Will my team actually use it?",
  "Does it work with our existing workflows?",
  "How long does implementation take?",
  "What happens if the AI makes a mistake?",
];

const faqSuggestions = [
  {
    question: "Does FlowPilot AI replace our project management tool?",
    answer:
      "No. FlowPilot connects and automates the workflows around your existing tools instead of forcing your team to migrate.",
  },
  {
    question: "How long does setup take?",
    answer: "Most teams can set up their first workflow in under one hour.",
  },
  {
    question: "Which tools does FlowPilot integrate with?",
    answer:
      "FlowPilot works with common operations tools including Slack, Google Workspace, Notion, Asana, HubSpot, and Zapier.",
  },
  {
    question: "Is this only for technical teams?",
    answer:
      "No. FlowPilot is designed for operations, customer success, and internal teams that need automation without engineering support.",
  },
  {
    question: "Can we review workflows before they go live?",
    answer:
      "Yes. You can test and approve workflows before activating them for your team.",
  },
];

const recommendedTools = [
  {
    category: "Analytics",
    tools: "Microsoft Clarity, Hotjar",
    note:
      "Use behavior analytics to see where visitors hesitate, scroll, or abandon the page.",
  },
  {
    category: "Forms",
    tools: "Tally, Typeform, Fillout",
    note:
      "Use a cleaner form experience if the demo request form is too long or hard to complete.",
  },
  {
    category: "CRM",
    tools: "HubSpot, Pipedrive",
    note:
      "Track demo requests, follow-up speed, pipeline stage, and conversion from form submission to booked call.",
  },
  {
    category: "A/B Testing",
    tools: "VWO, Convert",
    note:
      "Test the revised hero and CTA against the current page instead of relying on opinion.",
  },
  {
    category: "Copy Testing",
    tools: "AI copywriting tools",
    note:
      "Generate message variations quickly, then validate them against real visitor behavior.",
  },
];

const recoveryPlan = [
  {
    day: "Day 1",
    title: "Rewrite the hero section",
    detail:
      "Replace the broad AI workflow headline with a specific outcome-driven headline.",
  },
  {
    day: "Day 2",
    title: "Change the primary CTA",
    detail:
      'Test "Book a 15-Minute Workflow Review" instead of "Book a Demo."',
  },
  {
    day: "Day 3",
    title: "Move trust proof above the fold",
    detail:
      "Add one result, one testimonial, or one customer logo row near the first CTA.",
  },
  {
    day: "Day 4",
    title: "Add objection-handling FAQ",
    detail:
      "Answer setup time, integrations, migration, team adoption, and AI reliability.",
  },
  {
    day: "Day 5",
    title: "Simplify the demo form",
    detail:
      "Remove non-essential fields and make the next step feel faster and easier.",
  },
  {
    day: "Day 6",
    title: "Add behavior tracking",
    detail:
      "Install a heatmap or session recording tool to see where visitors drop off.",
  },
  {
    day: "Day 7",
    title: "Launch one A/B test",
    detail:
      "Test the revised hero and CTA against the current version for at least one full traffic cycle.",
  },
];

function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h2>
      {children ? (
        <div className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-950">{score}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function SampleReportPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_32rem)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-28">
          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Sample Pro Fix Plan
            </p>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Sample AI Landing Page Conversion Report
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              See what a full AI Conversion Clinic report looks like before you
              run your own audit. This sample shows how we diagnose conversion
              leaks, rewrite weak messaging, improve CTA clarity, uncover buyer
              objections, and turn a landing page into a 7-day fix plan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Run Your Free Diagnosis
              </Link>
              <Link
                href="#report"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                See What&apos;s Included
              </Link>
            </div>
          </div>

          <Card className="self-center">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Conversion Health Score
                </p>
                <p className="mt-1 text-5xl font-bold tracking-tight text-slate-950">
                  62
                  <span className="text-2xl text-slate-400">/100</span>
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                Needs Fixes
              </div>
            </div>

            <p className="mb-6 text-sm leading-6 text-slate-600">
              The page explains the product, but it does not make the value
              obvious fast enough. The hero section is too broad, the CTA is
              generic, and the page does not provide enough trust proof before
              asking visitors to book a demo.
            </p>

            <div className="space-y-4">
              {scoreItems.map((item) => (
                <ScoreBar
                  key={item.label}
                  label={item.label}
                  score={item.score}
                />
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section id="report" className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <SectionHeader
          eyebrow="Sample Context"
          title="The page being audited"
        >
          <p>
            This is a fictional example for a B2B SaaS landing page. Your own
            report is generated based on your offer, audience, conversion goal,
            and page context.
          </p>
        </SectionHeader>

        <Card className="mx-auto max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Company", "FlowPilot AI"],
              ["Type", "B2B SaaS"],
              ["Target audience", "Small operations teams"],
              ["Primary conversion goal", "Book a demo"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-1 font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700">Main issue</p>
            <p className="mt-1 text-slate-800">
              The page gets traffic from LinkedIn and Google Ads, but very few
              visitors book a demo.
            </p>
          </div>
        </Card>
      </section>

      <section className="bg-white px-6 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Executive Summary"
            title="The biggest problem is not the product. It is the conversion path."
          >
            <p>
              The page is asking visitors to book a demo before they fully
              understand why FlowPilot AI is different, what pain it solves, and
              whether it is credible enough to trust.
            </p>
          </SectionHeader>

          <Card className="mx-auto max-w-4xl">
            <p className="text-lg leading-8 text-slate-700">
              The page should make three things clear above the fold: who the
              product is for, what operational problem it solves, and what
              measurable result the visitor can expect. Right now, the page
              sounds useful but not urgent. The fix is to make the promise more
              specific, add stronger proof earlier, and replace the generic CTA
              with a clearer next step.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <SectionHeader eyebrow="Top 3 Conversion Leaks" title="What is hurting conversion">
          <p>
            A good audit does not list every possible issue. It identifies the
            few problems most likely to block action.
          </p>
        </SectionHeader>

        <div className="grid gap-6 md:grid-cols-3">
          {conversionLeaks.map((leak, index) => (
            <Card key={leak.title}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-slate-950">
                {leak.title}
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Current
                  </p>
                  <p className="mt-1 text-slate-800">{leak.current}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Problem
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {leak.problem}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Why it hurts conversion
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {leak.impact}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-16 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Hero Diagnosis"
            title="A stronger hero makes the value obvious faster"
          >
            <p className="text-slate-300">
              The current hero is too focused on the category: AI-powered
              workflows. The revised hero should focus on the painful business
              outcome: manual work, slow handoffs, missed follow-ups, and wasted
              team time.
            </p>
          </SectionHeader>

          <div className="mx-auto mb-8 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-medium text-slate-400">
              Current headline
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              AI-powered workflows for modern teams
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {heroOptions.map((option) => (
              <div
                key={option.label}
                className={`rounded-3xl border p-6 ${
                  option.recommended
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-300">
                    {option.label}
                  </p>
                  {option.recommended ? (
                    <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                      Recommended
                    </span>
                  ) : null}
                </div>

                <h3 className="text-xl font-bold leading-7 text-white">
                  {option.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {option.body}
                </p>
                <div className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
                  CTA: {option.cta}
                </div>
              </div>
            ))}
          </div>

          <Card className="mx-auto mt-8 max-w-4xl border-blue-200 bg-blue-50">
            <p className="font-semibold text-blue-900">
              Recommended version: Option B
            </p>
            <p className="mt-2 leading-7 text-blue-950">
              It keeps the product promise specific, reduces perceived
              complexity, and makes the demo feel more useful than a generic
              sales call.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              CTA Fixes
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Replace the generic demo CTA
            </h2>

            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Current CTA</p>
              <p className="mt-1 text-lg font-bold text-red-950">
                Book a Demo
              </p>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-slate-600">
                Better alternatives
              </p>
              <div className="space-y-3">
                {ctaAlternatives.map((cta) => (
                  <div
                    key={cta}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
                  >
                    {cta}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-700">
                Best CTA to test first
              </p>
              <p className="mt-1 font-bold text-blue-950">
                Book a 15-Minute Workflow Review
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                It tells the visitor what they will get from the call. “Book a
                Demo” sounds like a sales process. “Workflow Review” sounds like
                a useful diagnostic.
              </p>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Trust Proof
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Move proof closer to the first CTA
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Visitors need evidence before they take action. For this page,
              proof should appear near the hero, not only near the bottom.
            </p>

            <div className="mt-6 space-y-3">
              {trustRecommendations.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    ✓
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Objection Handling"
            title="Answer the questions that stop visitors from converting"
          >
            <p>
              A landing page should not only explain the product. It should also
              remove the doubts that stop buyers from taking the next step.
            </p>
          </SectionHeader>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <h3 className="text-2xl font-bold text-slate-950">
                Likely buyer objections
              </h3>
              <div className="mt-6 space-y-3">
                {buyerObjections.map((objection) => (
                  <div
                    key={objection}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                  >
                    {objection}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold text-slate-950">
                Suggested FAQ section
              </h3>
              <div className="mt-6 space-y-5">
                {faqSuggestions.map((faq) => (
                  <div
                    key={faq.question}
                    className="border-b border-slate-200 pb-5 last:border-b-0 last:pb-0"
                  >
                    <p className="font-semibold text-slate-950">
                      {faq.question}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <SectionHeader
          eyebrow="Recommended Tools"
          title="Tools that support this conversion fix"
        >
          <p>
            Tool recommendations should come from the diagnosis. The goal is not
            to push random software, but to prescribe tools that help verify and
            fix the conversion issue.
          </p>
        </SectionHeader>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {recommendedTools.map((item) => (
            <Card key={item.category} className="p-5">
              <p className="text-sm font-semibold text-blue-600">
                {item.category}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-950">
                {item.tools}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.note}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="7-Day Recovery Plan"
            title="A practical fix plan the user can implement this week"
          >
            <p>
              The report does not stop at diagnosis. It turns the findings into
              a prioritized action plan.
            </p>
          </SectionHeader>

          <div className="mx-auto max-w-4xl space-y-4">
            {recoveryPlan.map((item) => (
              <Card key={item.day} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="inline-flex w-fit shrink-0 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                    {item.day}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 leading-7 text-slate-600">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white md:px-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Run Your Own Audit
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Want this kind of report for your own landing page?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Run a free AI conversion diagnosis first. If the diagnosis is
            useful, unlock the full fix plan with rewritten copy, CTA
            recommendations, buyer objections, FAQ suggestions, tool
            recommendations, and a 7-day action plan.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
            >
              Run Free Diagnosis
            </Link>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            No guesswork. No generic checklist. Get a page-specific diagnosis
            based on your offer, audience, and conversion goal.
          </p>
        </div>
      </section>
    </main>
  );
}