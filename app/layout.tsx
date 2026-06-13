import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Conversion Clinic | AI 转化率急诊室",
  description: "3 分钟生成落地页/店铺页转化率诊断报告。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
