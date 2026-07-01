import type { Metadata } from "next";
import Link from "next/link";
import styles from "../blog.module.css";
import RelatedResources from "../RelatedResources";

export const metadata: Metadata = {
  alternates: { canonical: "/blog/why-your-landing-page-is-not-converting" },
  title:
    "Why Your Landing Page Is Not Converting — And What to Fix First | AI Conversion Clinic",
  description:
    "Learn why your landing page gets traffic but no conversions, and what to fix first across your headline, CTA, offer, proof, objections, and form flow.",
};

const conversionLeaks = [
  {
    title: "Your headline explains the category, not the outcome",
    problem:
      "Many landing pages say what the product is, but not why the visitor should care right now.",
    fix:
      "Rewrite the headline around the buyer outcome, painful problem, or measurable result.",
    example:
      "Instead of “AI workflow software for teams,” test “Automate recurring client handoffs without adding another project manager.”",
  },
  {
    title: "Your CTA is too generic",
    problem:
      "Buttons like “Submit,” “Learn More,” or “Book a Demo” often fail because they do not explain what happens next.",
    fix:
      "Make the CTA describe the next step and reduce perceived risk.",
    example:
      "Instead of “Book a Demo,” test “Book a 15-Minute Workflow Review.”",
  },
  {
    title: "Your page asks for action before building trust",
    problem:
      "Visitors need proof before they give you an email, book a call, start a trial, or buy.",
    fix:
      "Move testimonials, logos, results, screenshots, guarantees, or security proof closer to the first CTA.",
    example:
      "Add one customer result or proof point directly under the hero section.",
  },
  {
    title: "Your offer is not specific enough",
    problem:
      "A vague offer makes visitors compare you against every alternative in the category.",
    fix:
      "Clarify who the offer is for, what problem it solves, what is included, and why it is different.",
    example:
      "Replace broad claims with specific use cases, outcomes, and constraints.",
  },
  {
    title: "Your form or next step creates too much friction",
    problem:
      "Even interested visitors may abandon if the form is too long, unclear, or high commitment.",
    fix:
      "Remove unnecessary fields, explain what happens after submission, and offer a lower-friction first step.",
    example:
      "Ask for only the fields needed to start the conversation or diagnosis.",
  },
];

const fixOrder = [
  {
    step: "1",
    title: "Clarify the above-the-fold message",
    text:
      "Visitors should understand who the page is for, what problem it solves, and what result they can expect without scrolling.",
  },
  {
    step: "2",
    title: "Replace the primary CTA",
    text:
      "Use a CTA that describes the value of the next step, not just the action you want the visitor to take.",
  },
  {
    step: "3",
    title: "Move proof near the first decision point",
    text:
      "Add a testimonial, result, customer logo, screenshot, review, or trust statement before asking for a serious action.",
  },
  {
    step: "4",
    title: "Answer the objections that block action",
    text:
      "Use FAQ, microcopy, comparison sections, pricing context, or process explanation to remove doubts.",
  },
  {
    step: "5",
    title: "Measure behavior before redesigning everything",
    text:
      "Use analytics, heatmaps, recordings, and form data to see where visitors hesitate or drop off.",
  },
];

const checklist = [
  "Does the hero explain the buyer outcome in one sentence?",
  "Is the CTA specific enough to explain what happens next?",
  "Is there trust proof before or near the first CTA?",
  "Does the page answer the biggest buyer objections?",
  "Is the offer focused on one clear conversion goal?",
  "Is the form or checkout step as short as possible?",
  "Does the page match the traffic source that sent the visitor?",
  "Can a visitor understand the value in the first 5 seconds?",
];

export default function LandingPageNotConvertingArticle() {
  return (
    <main className={styles.page}>
      <article>
        <section className={styles.articleHero}>
          <div className={styles.articleHeroInner}>
            <Link href="/blog" className={styles.backLink}>
              ← Conversion Guides
            </Link>

            <p className={styles.badge}>Landing Page CRO</p>

            <h1>
              Why Your Landing Page Is Not Converting — And What to Fix First
            </h1>

            <p className={styles.lead}>
              If your landing page gets traffic but does not generate signups,
              demo bookings, leads, or sales, the problem is usually not one
              tiny button color. It is usually a clarity, trust, offer, or
              friction problem.
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
                <strong>Quick answer</strong>
                <p>
                  A landing page usually fails to convert because visitors do
                  not quickly understand the value, trust the offer, believe the
                  proof, or feel ready to take the next step.
                </p>
              </div>

              <div className={styles.sidebarCard}>
                <strong>Best first step</strong>
                <p>
                  Diagnose the page before redesigning it. Find the biggest
                  conversion leak, then fix one high-impact section at a time.
                </p>
                <Link href="/#audit-form">Run a free diagnosis →</Link>
              </div>
            </aside>

            <div className={styles.articleContent}>
              <h2>The real reason most landing pages do not convert</h2>

              <p>
                Most low-converting landing pages do not fail because they are
                ugly. They fail because they make the visitor work too hard to
                understand the offer.
              </p>

              <p>
                A visitor arriving from Google, paid ads, LinkedIn, Reddit,
                Product Hunt, email, or a referral is asking a simple question:
                “Is this for me, can I trust it, and what should I do next?”
              </p>

              <p>
                If your page does not answer those questions quickly, the
                visitor leaves. That is why conversion optimization should start
                with diagnosis, not redesign.
              </p>

              <div className={styles.callout}>
                <strong>Core principle:</strong> your landing page should make
                the next step feel obvious, valuable, and low-risk.
              </div>

              <h2>Five common conversion leaks</h2>

              <div className={styles.leakList}>
                {conversionLeaks.map((item, index) => (
                  <section className={styles.leakCard} key={item.title}>
                    <span>Leak {index + 1}</span>
                    <h3>{item.title}</h3>
                    <p>
                      <strong>Problem:</strong> {item.problem}
                    </p>
                    <p>
                      <strong>Fix:</strong> {item.fix}
                    </p>
                    <div>
                      <strong>Example:</strong>
                      <p>{item.example}</p>
                    </div>
                  </section>
                ))}
              </div>

              <h2>What to fix first</h2>

              <p>
                Do not start by changing everything. A full redesign can hide
                the real issue and make it harder to learn what actually moved
                conversion. Start with the sections closest to the visitor’s
                first decision.
              </p>

              <div className={styles.stepList}>
                {fixOrder.map((item) => (
                  <div className={styles.stepCard} key={item.step}>
                    <span>{item.step}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2>Landing page conversion checklist</h2>

              <p>
                Use this checklist before spending more money on ads, tools, or
                a redesign.
              </p>

              <ul className={styles.checklist}>
                {checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h2>When tools help</h2>

              <p>
                Tools are useful after you know what problem you are trying to
                solve. Behavior analytics can show where users hesitate. Form
                tools can reduce lead capture friction. A/B testing tools can
                validate your revised hero or CTA. CRM tools can reveal whether
                the issue is the page or the follow-up process.
              </p>

              <p>
                But tools cannot fix a weak offer, vague messaging, or missing
                trust proof by themselves. Start with the conversion problem,
                then choose the tool.
              </p>

              <div className={styles.inlineCta}>
                <h2>Not sure what is hurting your page?</h2>
                <p>
                  Run a free AI Conversion Clinic diagnosis. You will get a
                  page-specific review of the biggest blockers before deciding
                  whether to unlock the full fix plan.
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
                If your landing page is not converting, do not guess. Identify
                the biggest conversion leak first. In most cases, the first
                fixes should happen in your hero message, CTA, trust proof,
                objection handling, and form flow.
              </p>

              <p>
                Once those are clear, you can test variations and use tools to
                measure what changed.
              </p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
