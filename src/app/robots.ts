import type { MetadataRoute } from "next";

const BASE_URL = "https://zzatu.vercel.app";

/**
 * robots.txt (/robots.txt).
 *
 * 공개 페이지(홈·매물 상세·약관·개인정보)는 크롤 허용, 로그인 필요·비공개 경로는 차단한다.
 * 검색엔진은 로그인을 못 하므로 가드가 걸린 경로를 색인해봤자 로그인 화면만 잡힌다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/mypage",
        "/chat", // /chat, /chat/<roomId>
        "/login",
        "/items/new",
        "/items/*/edit", // 매물 수정(소유자 전용) — 상세 /items/<id> 는 허용
        "/auth/", // 콜백·에러
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
