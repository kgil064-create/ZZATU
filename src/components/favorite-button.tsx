"use client";

import { useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

import { toggleFavorite } from "@/app/actions/favorites";

/**
 * 찜 하트 버튼. (Phase: 찜)
 *
 * 채운 하트=찜됨 / 빈 하트=아님. 낙관적 업데이트 후 실패 시 롤백. 카드 위에 올라가므로
 * 클릭이 카드 Link 로 전파되지 않게 preventDefault+stopPropagation. 비로그인 클릭은
 * 로그인으로 유도(현재 경로를 redirect 로). 표시 여부(본인 글 숨김 등)는 호출부에서 결정.
 */
export function FavoriteButton({
  itemId,
  initialFavorited,
  variant = "card",
}: {
  itemId: string;
  initialFavorited: boolean;
  variant?: "card" | "detail";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const prev = favorited;
    setFavorited(!prev); // 낙관적
    setBusy(true);
    const res = await toggleFavorite(itemId);
    setBusy(false);

    if (res.error === "unauthenticated") {
      setFavorited(prev); // 롤백
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (res.error || typeof res.favorited !== "boolean") {
      setFavorited(prev); // 롤백
      return;
    }
    setFavorited(res.favorited); // 서버 확정값
  }

  const box =
    variant === "detail"
      ? "h-10 w-10"
      : "h-8 w-8 bg-background/90 shadow-sm";
  const icon = variant === "detail" ? 24 : 18;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? "찜 해제" : "찜하기"}
      className={
        "flex shrink-0 items-center justify-center rounded-full transition-colors " +
        box +
        (favorited ? " text-destructive" : " text-muted-foreground")
      }
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
