"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getOrCreateRoom } from "@/app/actions/chat";

/**
 * "채팅하기" 버튼. (Phase 5 · 5-A)
 *
 * 클릭 시 getOrCreateRoom(itemId) → 방으로 이동. 상세 page 에서 로그인 + 본인 글이
 * 아닐 때만 렌더된다(액션도 본인 글이면 서버에서 거부).
 */
export function ChatButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setBusy(true);
    const res = await getOrCreateRoom(itemId);
    if (res.error || !res.roomId) {
      setBusy(false);
      setError(res.error ?? "채팅을 시작할 수 없어요");
      return;
    }
    router.push(`/chat/${res.roomId}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="w-full rounded-base bg-primary py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "이동 중..." : "채팅하기"}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
