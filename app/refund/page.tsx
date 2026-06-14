export const metadata = {
  title: "Refund Policy | AI Conversion Clinic",
  description: "Refund policy for AI Conversion Clinic."
};

export default function RefundPage() {
  return (
    <main className="policy-page">
      <section className="policy-card">
        <p className="eyebrow">Refund policy</p>
        <h1>Refund Policy</h1>

        <p>
          AI Conversion Clinic provides instant digital audit reports. Because the report is generated immediately after payment, refunds are limited.
        </p>

        <h2>Eligible refund cases</h2>
        <ul>
          <li>Your payment was completed, but the report could not be generated because of a technical issue.</li>
          <li>You were charged more than once for the same audit by mistake.</li>
          <li>We are unable to help recover or regenerate a paid report after a verified payment.</li>
        </ul>

        <h2>Non-refundable cases</h2>
        <ul>
          <li>The report was successfully generated and delivered.</li>
          <li>You changed your mind after receiving the report.</li>
          <li>The submitted page information was incomplete, inaccurate, or unrelated to a conversion audit.</li>
        </ul>

        <h2>Request a refund</h2>
        <p>
          Email <a href="mailto:haiyangr@gmail.com">haiyangr@gmail.com</a> with your PayPal order ID and a short explanation of the issue.
        </p>
      </section>
    </main>
  );
}
