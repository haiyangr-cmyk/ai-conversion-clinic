export const metadata = {
  title: "Support | AI Conversion Clinic",
  description: "Support information for AI Conversion Clinic customers."
};

export default function SupportPage() {
  return (
    <main className="policy-page">
      <section className="policy-card">
        <p className="eyebrow">Customer support</p>
        <h1>Support</h1>

        <p>
          If your payment succeeds but your report does not generate correctly, contact us with your PayPal order ID.
        </p>

        <h2>Contact</h2>
        <p>
          Email: <a href="mailto:haiyangr@gmail.com">haiyangr@gmail.com</a>
        </p>

        <h2>Please include</h2>
        <ul>
          <li>Your PayPal order ID</li>
          <li>The email used during checkout, if provided</li>
          <li>The page URL you submitted</li>
          <li>A short description of the issue</li>
        </ul>

        <h2>Response time</h2>
        <p>
          We aim to respond within 2 business days.
        </p>
      </section>
    </main>
  );
}
