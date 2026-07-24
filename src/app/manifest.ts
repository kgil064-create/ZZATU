import type { MetadataRoute } from "next";

/**
 * PWA 웹 앱 매니페스트. (홈 화면에 추가)
 *
 * 서비스워커는 두지 않는다 — 오프라인 캐싱 없이 "홈 화면에 추가 + standalone 실행"
 * 까지만 지원한다. 그래서 안드로이드 크롬의 자동 설치 프롬프트(beforeinstallprompt)는
 * 오지 않을 수 있고, 그 경우의 안내는 InstallBanner 가 담당한다.
 *
 * 아이콘은 purpose 별로 소스를 나눴다. any 용(icon-192/512)은 라운드 코너가 박힌
 * icon.svg 기반이고, maskable 용은 코너 없는 정사각형 — 안드로이드가 한 번 더
 * 깎을 때 모서리가 이중으로 잘리지 않게 하기 위함이다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "짜투(ZZATU) — 제주 건축자재 자투리 거래",
    short_name: "짜투",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0E7C8C",
    lang: "ko",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
