import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 외부 URL 차단. 상대 경로(`/`로 시작, `//` 제외)만 통과.
 * 그 외에는 `/` 로 대체. (depth-in-defense — page.tsx 에서 한 번 거른 값을 콜백에서 다시 확인)
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

/**
 * 카카오 → Supabase → 짜투로 돌아오는 최종 착륙 지점.
 * 받은 `code` 를 세션으로 교환하고 원래 가려던 경로로 보낸다.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const error = url.searchParams.get("error");

  // 1. 사용자가 동의 화면에서 "취소"
  if (error === "access_denied") {
    return NextResponse.redirect(
      new URL("/auth/error?reason=denied", request.url),
    );
  }

  // 2. 그 외 OAuth 에러 또는 code 누락 (state 만료 포함)
  if (error || !code) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=state_expired", request.url),
    );
  }

  // 3. code 를 세션으로 교환 (서버 클라이언트가 쿠키에 세션 토큰 저장)
  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=exchange_failed", request.url),
    );
  }

  // 4. 성공 — 원래 가려던 경로로 이동
  return NextResponse.redirect(new URL(next, request.url));
}
