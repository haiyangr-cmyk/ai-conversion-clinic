import type { Metadata } from "next";
import Link from "next/link";
import styles from "../blog.module.css";
import RelatedResources from "../RelatedResources";

export const metadata: Metadata = {
  alternates: { canonical: "/blog/landing-page-conversion-checklist" },
  title:
    "Landing Page Conversion Checklist: 25 Things to Fix Before Buying More Traffic | AI Conversion Clinic",
  description:
    "Use this landing page conversion checklist to improve your headline, CTA, trust proof, offer clarity, objections, forms, analytics, and follow-up before spending more on traffic.",
};

const checklistGroups = [
  {
    title: "Above-the-fold clarity",
    intro:
      "The first screen should quickly explain who the page is for, what problem it solves, and why the visitor should continue.",
    items: [
      "The headline describes a specific buyer outcome, not just a product category.",
      "The subheadline explains who the offer is for and what result it helps create.",
      "The primary CTA is visible without scrolling on desktop and mobile.",
      "The page does not try to sell too many different offers above the fold.",
      "A first-time visitor can understand the page in 5 seconds.",
    ],
  },
  {
    title: "CTA strength",
    intro:
      "Your CTA should make the next step feel clear, valuable, and low-risk.",
    items: [
      "The CTA explains what happens next.",
      "The CTA is more specific than “Submit,” “Learn More,” or “Book a Demo.”",
      "The same primary CTA is repeated consistently throughout the page.",
      "Secondary CTAs do not distract from the main conversion goal.",
      "The button copy matches the visitor’s intent and stage of awareness.",
    ],
  },
  {
    title: "Trust and proof",
    intro:
      "Visitors need evidence before they give you an email, book a call, start a trial, or buy.",
    items: [
      "There is proof near the first CTA, not only at the bottom of the page.",
      "Testimonials mention specific outcomes, not generic praise.",
      "Customer logos, reviews, screenshots, or results support the main claim.",
      "The page avoids fake, exaggerated, or unsupported performance claims.",
      "Risk reducers are clear, such as guarantees, security notes, refund policy, or process transparency.",
    ],
  },
  {
    title: "Offer and objection handling",
    intro:
      "A landing page should answer the doubts that stop visitors from taking action.",
    items: [
      "The offer explains exactly what is included.",
      "The page makes clear who the offer is not for.",
      "The page addresses price, setup time, switching cost, delivery timeline, or required effort.",
      "The FAQ answers real buying objections instead of generic filler questions.",
      "The page explains why this offer is different from alternatives.",
    ],
  },
  {
    title: "Friction and measurement",
    intro:
      "Even a good offer can lose conversions if the next step is too hard or unmeasured.",
    items: [
      "Forms only ask for information needed at this stage.",
      "The page explains what happens after submission or purchase.",
      "Mobile spacing, readability, and button size are easy to use.",
      "Analytics or session recordings are installed to observe behavior.",
      "The page has one clear hypothesis to test next.",
    ],
  },
];

const priorityFixes = [
  {
    step: "1",
    title: "Fix the headline first",
    text:
      "If visitors do not understand the offer quickly, every other section has to work harder.",
  },
  {
    step: "2",
    title: "Make the CTA more specific",
    text:
      "A clearer CTA can improve intent quality even before you redesign the page.",
  },
  {
    step: "3",
    title: "Move proof closer to the CTA",
    text:
      "Trust proof should appear before the visitor is asked to make a meaningful decision.",
  },
  {
    step: "4",
    title: "Answer objections with FAQ and microcopy",
    text:
      "Use page copy to remove doubts about price, time, setup, risk, credibility, or process.",
  },
  {
    step: "5",
    title: "Measure one bottleneck",
    text:
      "Use behavior analytics, form analytics, or A/B testing to validate the next change.",
  },
];

export default function LandingPageConversionChecklistPage() {
  return (
    <main className={styles.page}>
      <article>
        <section className={styles.articleHero}>
          <div className={styles.articleHeroInner}>
            <Link href="/blog" className={styles.backLink}>
              ← Conversion Guides
            </Link>

            <p className={styles.badge}>Landing Page Checklist</p>

            <h1>
              Landing Page Conversion Checklist: 25 Things to Fix Before Buying
              More Traffic
            </h1>

            <p className={styles.lead}>
              Before you spend more on ads, SEO, cold outreach, or influencer
              traffic, use this checklist to find the conversion problems that
              may already be costing you signups, leads, demo bookings, and
              sales.
            </p>

            <div className={styles.heroActions}>
              <Link href="/#audit-form" className={styles.primaryButton}>
                Run Free Diagnosis
              </Link>
              <Link href="/sample-report" className={styles.secondaryButton}>
                View Sample Report
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.articleBody}>
          <div className={styles.contentGrid}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <strong>Quick use</strong>
                <p>
                  Go through each section and mark every item as clear, weak, or
                  missing. Fix the weakest high-impact section first.
                </p>
              </div>

              <div className={styles.sidebarCard}>
                <strong>Best first step</strong>
                <p>
                  If you are not sure where the leak is, run a free diagnosis
                  before redesigning the whole page.
                </p>
                <Link href="/#audit-form">Run a free diagnosis →</Link>
              </div>
            </aside>

            <div className={styles.articleContent}>
              <h2>Why use a landing page checklist?</h2>

              <p>
                Most landing page problems are not random. They usually appear
                in a few predictable areas: unclear message, weak CTA, missing
                proof, vague offer, unanswered objections, form friction, or poor
                follow-up.
              </p>

              <p>
                A checklist helps you avoid guessing. Instead of redesigning the
                whole page, you can isolate the section most likely to block
                conversion and fix that first.
              </p>

              <div className={styles.callout}>
                <strong>Rule:</strong> do not buy more traffic until the page
                clearly explains the offer, earns trust, and makes the next step
                easy.
              </div>

              <h2>The 25-point checklist</h2>

              <div className={styles.leakList}>
                {checklistGroups.map((group, index) => (
                  <section className={styles.leakCard} key={group.title}>
                    <span>Section {index + 1}</span>
                    <h3>{group.title}</h3>
                    <p>{group.intro}</p>

                    <ul className={styles.checklist}>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <h2>What to fix first</h2>

              <p>
                If you find many weak sections, do not fix everything at once.
                Prioritize the areas closest to the visitor’s first decision.
              </p>

              <div className={styles.stepList}>
                {priorityFixes.map((item) => (
                  <div className={styles.stepCard} key={item.step}>
                    <span>{item.step}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2>When to use tools</h2>

              <p>
                Tools are useful when they support a specific diagnosis. Use
                heatmaps or session recordings to find hesitation points. Use
                form tools to reduce friction. Use CRM tools to measure lead
                follow-up. Use A/B testing only when you have a clear hypothesis
                and enough traffic.
              </p>

              <p>
                If you do not know what to test, start with a diagnosis before
                adding another tool.
              </p>

              <div className={styles.inlineCta}>
                <h2>Want a page-specific checklist?</h2>
                <p>
                  Run a free AI Conversion Clinic diagnosis and get a
                  page-specific view of the biggest blockers before unlocking a
                  full fix plan.
                </p>

                <div className={styles.heroActions}>
                  <Link href="/#audit-form" className={styles.primaryButton}>
                    Run Free Diagnosis
                  </Link>
                  <Link href="/tools" className={styles.secondaryButton}>
                    See CRO Tools
                  </Link>
                </div>
              </div>

              <RelatedResources />

              <h2>Final takeaway</h2>

              <p>
                A landing page conversion checklist is useful because it forces
                you to inspect the basics before spending more money. In most
                cases, the first wins come from clearer positioning, stronger
                CTA copy, earlier proof, better objection handling, and less
                friction.
              </p>

              <p>
                Once those are fixed, use tools and tests to measure whether the
                changes actually improved conversion.
              </p>

              <p>
                Related guide:{" "}
                <Link href="/blog/why-your-landing-page-is-not-converting">
                  Why Your Landing Page Is Not Converting
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
