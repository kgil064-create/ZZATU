"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginButtonProps = {
  redirect?: string;
};

export function LoginButton({ redirect = "/" }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    // 정상 흐름에서는 카카오 동의 화면으로 이동하므로 아래 줄까지 안 옴.
    // OAuth 시작 자체가 실패한 경우만 여기로 떨어진다.
    if (error) {
      console.error("Kakao OAuth start failed:", error);
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      // 카카오 디자인 가이드: 배경 #FEE500, 텍스트 rgba(0,0,0,0.85). 토큰화하지 않고 하드코드.
      style={{ backgroundColor: "#FEE500", color: "rgba(0,0,0,0.85)" }}
      className="flex w-full items-center justify-center gap-2 rounded-base px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <KakaoSymbol />
      <span>{isLoading ? "이동 중..." : "카카오로 시작하기"}</span>
    </button>
  );
}

function KakaoSymbol() {
  // TODO: 카카오 공식 심볼 SVG 로 교체 (developers.kakao.com 디자인 가이드 참고).
  // 현재는 단순화한 말풍선 아이콘 placeholder.
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.73 1.7 5.12 4.27 6.55l-.78 2.84c-.07.25.21.45.43.31l3.36-2.16c.89.14 1.81.21 2.72.21 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}
