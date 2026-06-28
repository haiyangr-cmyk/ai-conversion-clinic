import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./sample-report.module.css";

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
    detail: 'Test "Book a 15-Minute Workflow Review" instead of "Book a Demo."',
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
    <div className={styles.sectionHeader}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={styles.h2}>{title}</h2>
      {children ? <div className={styles.headerText}>{children}</div> : null}
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
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className={styles.scoreRowTop}>
        <span>{label}</span>
        <span>{score}/10</span>
      </div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}

export default function SampleReportPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.badge}>Sample Pro Fix Plan</p>
            <h1 className={styles.h1}>
              Sample AI Landing Page Conversion Report
            </h1>
            <p className={styles.lead}>
              See what a full AI Conversion Clinic report looks like before you
              run your own audit. This sample shows how we diagnose conversion
              leaks, rewrite weak messaging, improve CTA clarity, uncover buyer
              objections, and turn a landing page into a 7-day fix plan.
            </p>

            <div className={styles.actions}>
              <Link href="/" className={styles.primaryButton}>
                Run Your Free Diagnosis
              </Link>
              <Link href="#report" className={styles.secondaryButton}>
                See What&apos;s Included
              </Link>
            </div>
          </div>

          <Card>
            <div className={styles.scoreTop}>
              <div>
                <p className={styles.smallLabel}>Conversion Health Score</p>
                <p className={styles.score}>
                  62<span>/100</span>
                </p>
              </div>
              <div className={styles.status}>Needs Fixes</div>
            </div>

            <p className={styles.muted}>
              The page explains the product, but it does not make the value
              obvious fast enough. The hero section is too broad, the CTA is
              generic, and the page does not provide enough trust proof before
              asking visitors to book a demo.
            </p>

            <div className={styles.scoreList}>
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

      <section id="report" className={styles.section}>
        <SectionHeader eyebrow="Sample Context" title="The page being audited">
          <p>
            This is a fictional example for a B2B SaaS landing page. Your own
            report is generated based on your offer, audience, conversion goal,
            and page context.
          </p>
        </SectionHeader>

        <Card>
          <div className={styles.contextGrid}>
            {[
              ["Company", "FlowPilot AI"],
              ["Type", "B2B SaaS"],
              ["Target audience", "Small operations teams"],
              ["Primary conversion goal", "Book a demo"],
            ].map(([label, value]) => (
              <div key={label} className={styles.miniCard}>
                <p className={styles.smallLabel}>{label}</p>
                <p className={styles.miniCardValue}>{value}</p>
              </div>
            ))}
          </div>

          <div className={styles.warningCard}>
            <p className={styles.smallLabel}>Main issue</p>
            <p>
              The page gets traffic from LinkedIn and Google Ads, but very few
              visitors book a demo.
            </p>
          </div>
        </Card>
      </section>

      <section className={styles.whiteSection}>
        <div className={styles.section}>
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

          <Card className={styles.summaryCard}>
            <p className={styles.summaryText}>
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

      <section className={styles.section}>
        <SectionHeader
          eyebrow="Top 3 Conversion Leaks"
          title="What is hurting conversion"
        >
          <p>
            A good audit does not list every possible issue. It identifies the
            few problems most likely to block action.
          </p>
        </SectionHeader>

        <div className={styles.threeGrid}>
          {conversionLeaks.map((leak, index) => (
            <Card key={leak.title}>
              <div className={styles.number}>{index + 1}</div>
              <h3 className={styles.h3}>{leak.title}</h3>

              <div className={styles.block}>
                <p className={styles.blockTitle}>Current</p>
                <p className={styles.blockText}>{leak.current}</p>
              </div>
              <div className={styles.block}>
                <p className={styles.blockTitle}>Problem</p>
                <p className={styles.blockText}>{leak.problem}</p>
              </div>
              <div className={styles.block}>
                <p className={styles.blockTitle}>Why it hurts conversion</p>
                <p className={styles.blockText}>{leak.impact}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.darkInner}>
          <SectionHeader
            eyebrow="Hero Diagnosis"
            title="A stronger hero makes the value obvious faster"
          >
            <p>
              The current hero is too focused on the category: AI-powered
              workflows. The revised hero should focus on the painful business
              outcome: manual work, slow handoffs, missed follow-ups, and wasted
              team time.
            </p>
          </SectionHeader>

          <div className={styles.currentHeadline}>
            <p>Current headline</p>
            <strong>AI-powered workflows for modern teams</strong>
          </div>

          <div className={styles.darkCards}>
            {heroOptions.map((option) => (
              <div
                key={option.label}
                className={`${styles.darkCard} ${
                  option.recommended ? styles.recommendedDarkCard : ""
                }`}
              >
                <div className={styles.darkCardTop}>
                  <span>{option.label}</span>
                  {option.recommended ? (
                    <span className={styles.recommendedBadge}>
                      Recommended
                    </span>
                  ) : null}
                </div>

                <h3 className={styles.darkCardTitle}>{option.title}</h3>
                <p className={styles.darkCardText}>{option.body}</p>
                <div className={styles.ctaBox}>CTA: {option.cta}</div>
              </div>
            ))}
          </div>

          <div className={styles.recommendationNote}>
            <strong>Recommended version: Option B</strong>
            <p>
              It keeps the product promise specific, reduces perceived
              complexity, and makes the demo feel more useful than a generic
              sales call.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.twoGrid}>
          <Card>
            <p className={styles.eyebrow}>CTA Fixes</p>
            <h2 className={styles.h2}>Replace the generic demo CTA</h2>

            <div className={styles.redBox}>
              <p className={styles.smallLabel}>Current CTA</p>
              <h3 className={styles.h3}>Book a Demo</h3>
            </div>

            <div className={styles.listStack}>
              {ctaAlternatives.map((cta) => (
                <div key={cta} className={styles.listItem}>
                  <span className={styles.check}>✓</span>
                  <span>{cta}</span>
                </div>
              ))}
            </div>

            <div className={styles.blueBox}>
              <p className={styles.smallLabel}>Best CTA to test first</p>
              <h3 className={styles.h3}>
                Book a 15-Minute Workflow Review
              </h3>
              <p className={styles.blockText}>
                It tells the visitor what they will get from the call. “Book a
                Demo” sounds like a sales process. “Workflow Review” sounds like
                a useful diagnostic.
              </p>
            </div>
          </Card>

          <Card>
            <p className={styles.eyebrow}>Trust Proof</p>
            <h2 className={styles.h2}>
              Move proof closer to the first CTA
            </h2>
            <p className={styles.muted}>
              Visitors need evidence before they take action. For this page,
              proof should appear near the hero, not only near the bottom.
            </p>

            <div className={styles.listStack}>
              {trustRecommendations.map((item) => (
                <div key={item} className={styles.listItem}>
                  <span className={styles.check}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className={styles.whiteSection}>
        <div className={styles.section}>
          <SectionHeader
            eyebrow="Objection Handling"
            title="Answer the questions that stop visitors from converting"
          >
            <p>
              A landing page should not only explain the product. It should also
              remove the doubts that stop buyers from taking the next step.
            </p>
          </SectionHeader>

          <div className={styles.twoGrid}>
            <Card>
              <h3 className={styles.h3}>Likely buyer objections</h3>
              <div className={styles.listStack}>
                {buyerObjections.map((objection) => (
                  <div key={objection} className={styles.listItem}>
                    {objection}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className={styles.h3}>Suggested FAQ section</h3>
              <div className={styles.listStack}>
                {faqSuggestions.map((faq) => (
                  <div key={faq.question} className={styles.miniCard}>
                    <strong>{faq.question}</strong>
                    <p className={styles.blockText}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className={styles.section}>
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

        <div className={styles.toolGrid}>
          {recommendedTools.map((item) => (
            <Card key={item.category} className={styles.toolCard}>
              <p className={styles.toolCategory}>{item.category}</p>
              <h3 className={styles.toolTitle}>{item.tools}</h3>
              <p className={styles.blockText}>{item.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.whiteSection}>
        <div className={styles.section}>
          <SectionHeader
            eyebrow="7-Day Recovery Plan"
            title="A practical fix plan the user can implement this week"
          >
            <p>
              The report does not stop at diagnosis. It turns the findings into
              a prioritized action plan.
            </p>
          </SectionHeader>

          <div className={styles.planList}>
            {recoveryPlan.map((item) => (
              <Card key={item.day} className={styles.planCard}>
                <div className={styles.dayBadge}>{item.day}</div>
                <div>
                  <h3 className={styles.h3}>{item.title}</h3>
                  <p className={styles.blockText}>{item.detail}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.finalCta}>
          <p className={styles.eyebrow}>Run Your Own Audit</p>
          <h2>Want this kind of report for your own landing page?</h2>
          <p>
            Run a free AI conversion diagnosis first. If the diagnosis is
            useful, unlock the full fix plan with rewritten copy, CTA
            recommendations, buyer objections, FAQ suggestions, tool
            recommendations, and a 7-day action plan.
          </p>

          <Link href="/" className={styles.darkButton}>
            Run Free Diagnosis
          </Link>

          <p>
            No guesswork. No generic checklist. Get a page-specific diagnosis
            based on your offer, audience, and conversion goal.
          </p>
        </div>
      </section>
    </main>
  );
}