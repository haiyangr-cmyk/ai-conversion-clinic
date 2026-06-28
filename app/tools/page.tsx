import type { Metadata } from "next";
import Link from "next/link";
import styles from "./tools.module.css";

export const metadata: Metadata = {
  title: "CRO Tools for Landing Page Optimization | AI Conversion Clinic",
  description:
    "Explore tools for landing page optimization, behavior analytics, form conversion, A/B testing, CRM follow-up, and AI copy improvement.",
};

const toolCategories = [
  {
    title: "Behavior Analytics",
    description:
      "See where visitors scroll, hesitate, rage click, or abandon your landing page.",
    tools: ["Microsoft Clarity", "Hotjar", "Mouseflow"],
    bestFor: "Diagnosing invisible conversion friction",
    useWhen:
      "You have traffic, but you do not know where users are getting stuck.",
  },
  {
    title: "Forms & Lead Capture",
    description:
      "Reduce form friction and make the next step easier for visitors to complete.",
    tools: ["Tally", "Typeform", "Fillout", "Jotform"],
    bestFor: "Improving lead generation and demo request flows",
    useWhen:
      "Visitors click your CTA but do not finish the form or booking step.",
  },
  {
    title: "Landing Page Builders",
    description:
      "Build, publish, and test landing pages without rebuilding your whole site.",
    tools: ["Unbounce", "Leadpages", "Webflow", "Framer"],
    bestFor: "Testing new offers, ad pages, and campaign landing pages",
    useWhen:
      "You need to ship landing page variations quickly.",
  },
  {
    title: "A/B Testing",
    description:
      "Test headlines, CTAs, proof sections, forms, and page layouts with real traffic.",
    tools: ["VWO", "Convert", "Optimizely"],
    bestFor: "Validating conversion fixes with data",
    useWhen:
      "You have enough traffic and want to compare page variants.",
  },
  {
    title: "CRM & Follow-up",
    description:
      "Track leads, demo requests, follow-up speed, and sales pipeline conversion.",
    tools: ["HubSpot", "Pipedrive", "Close"],
    bestFor: "Improving demo booking and lead-to-customer conversion",
    useWhen:
      "You are getting leads but not converting enough of them into calls or customers.",
  },
  {
    title: "AI Copywriting",
    description:
      "Generate headline, CTA, FAQ, objection-handling, and value proposition variations.",
    tools: ["ChatGPT", "Jasper", "Copy.ai", "Anyword"],
    bestFor: "Creating copy variants to test",
    useWhen:
      "Your message is unclear, too generic, or not specific enough to the buyer.",
  },
];

const workflows = [
  {
    title: "Traffic but no conversions",
    steps: [
      "Run a free AI Conversion Clinic diagnosis",
      "Install Microsoft Clarity or Hotjar",
      "Review scroll depth and rage clicks",
      "Rewrite the hero and CTA",
      "Test one revised page variant",
    ],
  },
  {
    title: "Low demo bookings",
    steps: [
      "Clarify the demo promise",
      "Replace “Book a Demo” with a more specific CTA",
      "Shorten the form",
      "Connect form submissions to HubSpot or Pipedrive",
      "Measure follow-up speed and booked-call rate",
    ],
  },
  {
    title: "Paid ads not converting",
    steps: [
      "Match the landing page headline to ad intent",
      "Add proof above the first CTA",
      "Use a campaign-specific landing page builder",
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
            Use these tools to understand visitor behavior, reduce friction,
            improve your CTA, capture more leads, and test better landing page
            variations.
          </p>

          <div className={styles.actions}>
            <Link href="/" className={styles.primaryButton}>
              Run Free Diagnosis
            </Link>
            <Link href="/sample-report" className={styles.secondaryButton}>
              View Sample Report
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Recommended Categories</p>
          <h2>Start with the conversion problem, then choose the tool.</h2>
          <p>
            The best CRO stack is not the one with the most software. It is the
            one that helps you find the leak, fix the message, and measure the
            result.
          </p>
        </div>

        <div className={styles.toolGrid}>
          {toolCategories.map((category) => (
            <article className={styles.card} key={category.title}>
              <div className={styles.cardTop}>
                <h3>{category.title}</h3>
                <span>{category.bestFor}</span>
              </div>

              <p className={styles.description}>{category.description}</p>

              <div className={styles.toolList}>
                {category.tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>

              <div className={styles.useWhen}>
                <strong>Use when:</strong>
                <p>{category.useWhen}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Workflows</p>
          <h2>Recommended tool workflows by conversion problem.</h2>
          <p>
            Start with diagnosis, then use tools only where they help verify or
            implement the fix.
          </p>
        </div>

        <div className={styles.workflowGrid}>
          {workflows.map((workflow) => (
            <article className={styles.workflowCard} key={workflow.title}>
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
            your page and gives you a practical fix plan.
          </p>

          <Link href="/" className={styles.primaryButton}>
            Run Free Diagnosis
          </Link>
        </div>
      </section>
    </main>
  );
}