"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { revealPhone } from "@/app/actions/items";

/**
 * "전화하기" 버튼. (Phase 3 · 결정 #1)
 *
 * 클릭 시 revealPhone(itemId) 로 번호를 받아 tel: 로 연결한다. 번호는 화면 텍스트로
 * 절대 렌더하지 않는다. 비로그인이면 로그인으로 보내고, 거래완료면 비활성한다.
 */
export function CallButton({
  itemId,
  isSold,
}: {
  itemId: string;
  isSold: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSold) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-base bg-muted py-3 text-base font-medium text-muted-foreground"
      >
        거래완료된 자재예요
      </button>
    );
  }

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await revealPhone(itemId);
    setLoading(false);

    if (res.error === "unauthenticated") {
      router.push(`/login?redirect=/items/${itemId}`);
      return;
    }
    if (res.error || !res.phone) {
      setError("전화번호를 불러오지 못했어요");
      return;
    }
    window.location.href = `tel:${res.phone}`;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-base bg-primary py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "연결 중..." : "전화하기"}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
