import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingChatButton } from "@/components/floating-chat-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://zzatu.vercel.app"),
  title: {
    default: "짜투(ZZATU) — 제주 건축자재 중고거래",
    template: "%s | 짜투",
  },
  description:
    "제주 지역 건축자재를 사고, 팔고, 나누고, 구하는 중고거래 플랫폼. 자재의 가치를 잇다.",
  openGraph: {
    title: "짜투(ZZATU) — 제주 건축자재 중고거래",
    description:
      "제주 지역 건축자재를 사고, 팔고, 나누고, 구하는 중고거래 플랫폼. 자재의 가치를 잇다.",
    url: "https://zzatu.vercel.app",
    siteName: "짜투",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
        <FloatingChatButton />
      </body>
    </html>
  );
}
