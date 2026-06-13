import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Conversion Clinic | Landing Page Conversion Audit",
  description: "Get an actionable AI conversion audit for your landing page, Shopify store, SaaS page, or sales page in minutes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
