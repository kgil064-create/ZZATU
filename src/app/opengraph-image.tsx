import { ImageResponse } from "next/og";

export const alt = "짜투(ZZATU) — 제주 건축자재 중고거래";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "짜투 ZZATU";
const SUBTITLE = "자재의 가치를 잇다 · 제주 건축자재 중고거래";

/**
 * next/og(satori)는 기본 폰트로 한글을 못 그리므로 Noto Sans KR 서브셋을 받아 넘긴다.
 * Google Fonts css2 는 기본적으로 woff2 를 주는데 satori 는 ttf/otf/woff 만 지원해서,
 * 구형 UA 로 요청해 truetype 을 받는다. 실패하면 null → 한글이 안 나올 수 있으나 크래시는 없음.
 */
async function loadKoreanFont(): Promise<ArrayBuffer | null> {
  try {
    const text = TITLE + SUBTITLE;
    const api = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(
      text,
    )}`;
    const css = await fetch(api, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
      },
    }).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const fontData = await loadKoreanFont();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0E7C8C",
          color: "#FFFFFF",
          fontFamily: fontData ? "Noto Sans KR" : "sans-serif",
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -2 }}>
          {TITLE}
        </div>
        <div style={{ fontSize: 42, marginTop: 28, opacity: 0.92 }}>
          {SUBTITLE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans KR", data: fontData, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
