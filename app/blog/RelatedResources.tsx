import Link from "next/link";
import styles from "./blog.module.css";

const resources = [
  {
    title: "View a Sample Report",
    description:
      "See what a full AI Conversion Clinic fix plan looks like before running your own audit.",
    href: "/sample-report",
    label: "Sample Report",
  },
  {
    title: "See CRO Tools",
    description:
      "Explore tools for behavior analytics, forms, A/B testing, CRM follow-up, and AI copy improvement.",
    href: "/tools",
    label: "CRO Tools",
  },
  {
    title: "Run a Free Diagnosis",
    description:
      "Get a page-specific diagnosis of the biggest conversion blockers on your landing page.",
    href: "/#audit-form",
    label: "Free Diagnosis",
  },
];

export default function RelatedResources() {
  return (
    <section className={styles.relatedResources}>
      <div className={styles.relatedHeader}>
        <p>Related resources</p>
        <h2>Keep improving your landing page conversion.</h2>
      </div>

      <div className={styles.relatedGrid}>
        {resources.map((item) => (
          <Link href={item.href} className={styles.relatedCard} key={item.href}>
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <strong>Open →</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
