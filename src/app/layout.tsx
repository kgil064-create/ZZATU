import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingChatButton } from "@/components/floating-chat-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://zzatu.vercel.app"),
  title: {
    default: "짜투(ZZATU) — 제주 건축자재 자투리 거래",
    template: "%s | 짜투",
  },
  description:
    "제주에서 현장에 남은 건축자재와 자투리 자재를 사고팔고 나누는 중고거래 플랫폼. 남은 자재의 가치를 잇다.",
  openGraph: {
    title: "짜투(ZZATU) — 제주 건축자재 자투리 거래",
    description:
      "제주에서 현장에 남은 건축자재와 자투리 자재를 사고팔고 나누는 중고거래 플랫폼. 남은 자재의 가치를 잇다.",
    url: "https://zzatu.vercel.app",
    siteName: "짜투",
    locale: "ko_KR",
    type: "website",
  },
  verification: {
    google: "AYaLf0L1dOT8fmwR9ICYIfKsBX1pbGb5hXOTvllerSk",
  },
  // iOS 는 매니페스트를 거의 읽지 않는다 — 홈 화면 추가 시 standalone 실행과
  // 앱 이름은 이 메타 태그로 결정된다. 아이콘은 app/apple-icon.png 가 담당.
  appleWebApp: {
    capable: true,
    title: "짜투",
    statusBarStyle: "default",
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
