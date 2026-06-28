import type { Metadata } from "next";
import Link from "next/link";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "Conversion Guides | AI Conversion Clinic",
  description:
    "Practical landing page conversion guides for SaaS founders, marketers, agencies, and online businesses.",
};

const posts = [
  {
    title: "Why Your Landing Page Is Not Converting — And What to Fix First",
    description:
      "Learn the most common reasons landing pages get traffic but no signups, leads, demo bookings, or sales.",
    href: "/blog/why-your-landing-page-is-not-converting",
    tag: "Landing Page CRO",
  },
];

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <section className={styles.blogHero}>
        <div className={styles.blogHeroInner}>
          <p className={styles.badge}>Conversion Guides</p>
          <h1>Practical guides to diagnose and fix landing page conversion problems.</h1>
          <p>
            Learn how to improve landing page clarity, CTA strength, trust proof,
            offer structure, and funnel friction.
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

      <section className={styles.blogListSection}>
        <div className={styles.blogList}>
          {posts.map((post) => (
            <Link href={post.href} className={styles.postCard} key={post.href}>
              <span>{post.tag}</span>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <strong>Read guide →</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
