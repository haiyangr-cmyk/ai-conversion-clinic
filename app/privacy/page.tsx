export const metadata = {
  title: "Privacy Policy | AI Conversion Clinic",
  description: "Privacy policy for AI Conversion Clinic."
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <section className="policy-card">
        <p className="eyebrow">Privacy policy</p>
        <h1>Privacy Policy</h1>

        <p>
          AI Conversion Clinic collects only the information needed to generate your conversion audit report, process payment, and provide support.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>The page URL you submit</li>
          <li>Your product or service description</li>
          <li>Your target customer description</li>
          <li>Your main conversion problem</li>
          <li>Optional page copy or extra context</li>
          <li>Your email address, if provided</li>
          <li>Payment and order information from PayPal</li>
          <li>The generated audit report</li>
        </ul>

        <h2>How we use this information</h2>
        <ul>
          <li>To generate your AI conversion audit report</li>
          <li>To process and verify payment</li>
          <li>To provide payment support or report recovery</li>
          <li>To improve the product experience</li>
        </ul>

        <h2>Payment information</h2>
        <p>
          Payments are processed by PayPal. We do not store your card or bank details.
        </p>

        <h2>AI processing</h2>
        <p>
          The information you submit may be processed by AI systems to generate your report. Do not submit passwords, private customer data, financial records, or confidential business information.
        </p>

        <h2>Data deletion</h2>
        <p>
          You can request deletion of your submitted information by emailing <a href="mailto:haiyangr@gmail.com">haiyangr@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
