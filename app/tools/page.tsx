import type { Metadata } from "next";
import Link from "next/link";
import styles from "./tools.module.css";

export const metadata: Metadata = {
  title: "CRO Tools for Landing Page Optimization | AI Conversion Clinic",
  description:
    "Explore CRO tools for behavior analytics, lead capture, landing pages, A/B testing, CRM follow-up, and AI copy improvement.",
};

const toolCategories = [
  {
    title: "Behavior Analytics",
    bestFor: "Finding where visitors hesitate, scroll, rage click, or abandon",
    problem:
      "You have traffic, but you do not know why visitors are not converting.",
    tools: ["Microsoft Clarity", "Hotjar", "Mouseflow"],
    why:
      "Behavior analytics helps you see real user behavior before guessing what to redesign.",
    useWhen:
      "Use this first when your landing page gets visits but not enough signups, leads, demo bookings, or sales.",
  },
  {
    title: "Forms & Lead Capture",
    bestFor: "Reducing friction in demo, lead, signup, or application flows",
    problem:
      "Visitors click the CTA but do not finish the form or booking step.",
    tools: ["Tally", "Typeform", "Fillout", "Jotform"],
    why:
      "Better forms can reduce abandonment and make the next step feel easier.",
    useWhen:
      "Use this when form completion, demo request, or lead submission rate is weak.",
  },
  {
    title: "Landing Page Builders",
    bestFor: "Launching page variants without rebuilding the full website",
    problem:
      "You need to test a new offer, campaign, audience, or page angle quickly.",
    tools: ["Unbounce", "Leadpages", "Webflow", "Framer"],
    why:
      "Landing page builders make it easier to ship focused pages for one audience and one conversion goal.",
    useWhen:
      "Use this when paid traffic, SEO pages, launch pages, or campaign pages need dedicated landing pages.",
  },
  {
    title: "A/B Testing",
    bestFor: "Testing revised headlines, CTAs, forms, and proof sections",
    problem:
      "You have a hypothesis but need to validate whether the change improves conversion.",
    tools: ["VWO", "Convert", "Optimizely"],
    why:
      "A/B testing helps compare page variants with real visitor behavior instead of opinion.",
    useWhen:
      "Use this when you have enough traffic and one clear conversion hypothesis to test.",
  },
  {
    title: "CRM & Follow-up",
    bestFor: "Improving lead-to-call, demo-to-customer, and sales follow-up",
    problem:
      "Leads are coming in, but not enough become calls, trials, or customers.",
    tools: ["HubSpot", "Pipedrive", "Close"],
    why:
      "CRM tools help track lead quality, follow-up speed, pipeline stage, and conversion after the form submit.",
    useWhen:
      "Use this when the landing page gets leads but revenue or booked-call conversion is weak.",
  },
  {
    title: "AI Copywriting",
    bestFor: "Generating headline, CTA, FAQ, and objection-handling variants",
    problem:
      "Your copy is too vague, generic, or disconnected from the buyer’s problem.",
    tools: ["ChatGPT", "Jasper", "Copy.ai", "Anyword"],
    why:
      "AI copy tools help generate message variations quickly, but the final copy still needs to be validated.",
    useWhen:
      "Use this when you need faster copy iteration for headlines, CTAs, proof, FAQs, and offer framing.",
  },
];

const workflows = [
  {
    title: "Traffic but no conversions",
    stack: "Behavior analytics → Hero rewrite → CTA test",
    steps: [
      "Run a free AI Conversion Clinic diagnosis",
      "Install a behavior analytics tool",
      "Watch where visitors hesitate or abandon",
      "Rewrite the hero and CTA",
      "Test one revised version",
    ],
  },
  {
    title: "CTA clicks but no submissions",
    stack: "Form tool → Trust copy → CRM tracking",
    steps: [
      "Shorten the form",
      "Clarify what happens after submission",
      "Add reassurance near the form",
      "Track submissions in a CRM",
      "Measure booked-call or qualified-lead rate",
    ],
  },
  {
    title: "Paid ads not converting",
    stack: "Landing page builder → Proof section → A/B test",
    steps: [
      "Match the landing page headline to the ad promise",
      "Use one page for one audience and one offer",
      "Move proof above or near the first CTA",
      "Track user behavior",
      "A/B test headline and CTA combinations",
    ],
  },
];

export default function ToolsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.badge}>CRO Tool Stack</p>
          <h1>Tools to diagnose and fix landing page conversion problems.</h1>
          <p>
            Start with the conversion problem, then choose tools that help you
            verify, implement, or measure the fix.
          </p>

          <div className={styles.actions}>
            <Link href="/#audit-form" className={styles.primaryButton}>
              Run Free Diagnosis
            </Link>
            <Link href="/sample-report" className={styles.secondaryButton}>
              View Sample Report
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.disclosureSection}>
        <div className={styles.disclosureBox}>
          <strong>Affiliate-ready note</strong>
          <p>
            This page is structured for future tool partnerships. Current tool
            mentions are informational and should be selected based on your
            conversion problem, traffic level, budget, and workflow.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Recommended Categories</p>
          <h2>Choose tools based on the conversion leak.</h2>
          <p>
            A tool is only useful when it helps you diagnose, fix, or measure a
            specific conversion blocker.
          </p>
        </div>

        <div className={styles.toolGrid}>
          {toolCategories.map((category) => (
            <article className={styles.card} key={category.title}>
              <div className={styles.cardTop}>
                <h3>{category.title}</h3>
                <span>{category.bestFor}</span>
              </div>

              <div className={styles.problemBox}>
                <strong>Problem it solves</strong>
                <p>{category.problem}</p>
              </div>

              <div className={styles.toolList}>
                {category.tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>

              <div className={styles.useWhen}>
                <strong>Why it helps</strong>
                <p>{category.why}</p>
              </div>

              <div className={styles.useWhen}>
                <strong>Use when</strong>
                <p>{category.useWhen}</p>
              </div>

              <div className={styles.cardActions}>
                <Link href="/#audit-form">Diagnose first</Link>
                <Link href="/blog/best-cro-tools-for-small-businesses">
                  Read guide
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Workflows</p>
          <h2>Recommended CRO workflows by conversion problem.</h2>
          <p>
            The best stack depends on whether the issue is message clarity,
            trust, form friction, follow-up, or testing.
          </p>
        </div>

        <div className={styles.workflowGrid}>
          {workflows.map((workflow) => (
            <article className={styles.workflowCard} key={workflow.title}>
              <span>{workflow.stack}</span>
              <h3>{workflow.title}</h3>
              <ol>
                {workflow.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <p className={styles.badge}>Not sure what to fix first?</p>
          <h2>Run a free landing page diagnosis before buying more tools.</h2>
          <p>
            AI Conversion Clinic identifies the biggest conversion blockers on
            your page and gives you a practical fix path.
          </p>

          <Link href="/#audit-form" className={styles.primaryButton}>
            Run Free Diagnosis
          </Link>
        </div>
      </section>
    </main>
  );
}
