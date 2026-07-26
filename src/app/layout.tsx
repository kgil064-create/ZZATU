import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SiteHeader, SiteHeaderSkeleton } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingChatButtonSlot } from "@/components/floating-chat-button-slot";

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
        {/* 헤더는 세션 조회를 기다린다 — Suspense 로 끊어 페이지 본문이 헤더를
            기다리지 않고 먼저 스트리밍되게 한다. */}
        <Suspense fallback={<SiteHeaderSkeleton />}>
          <SiteHeader />
        </Suspense>
        {children}
        <SiteFooter />
        <FloatingChatButtonSlot />
      </body>
    </html>
  );
}
