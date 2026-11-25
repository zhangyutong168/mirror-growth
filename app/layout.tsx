import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirror · 爆款对标与账号增长台",
  description:
    "找到最适合你模仿的爆款（不是最火的），拆解它为什么火，持续盯热点、盯同行、定期体检你的账号。本地计算，数据不出设备。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
