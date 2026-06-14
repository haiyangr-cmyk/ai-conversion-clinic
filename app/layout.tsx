import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Conversion Clinic | Landing Page Conversion Audit",
  description: "Get an actionable AI conversion audit for your landing page, Shopify store, SaaS page, or sales page in minutes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.paypal.com" />
        <link rel="preconnect" href="https://www.paypalobjects.com" />
        <link rel="dns-prefetch" href="https://www.paypal.com" />
        <link rel="dns-prefetch" href="https://www.paypalobjects.com" />
      </head>
      <body>{children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <span>© AI Conversion Clinic</span>
            <nav aria-label="Footer navigation">
              <a href="/support">Support</a>
              <a href="/refund">Refund Policy</a>
              <a href="/privacy">Privacy Policy</a>
            </nav>
          </div>
        </footer></body>
    </html>
  );
}
