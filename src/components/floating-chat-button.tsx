"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

/**
 * 전역 채팅 진입 플로팅 버튼(FAB).
 *
 * 루트 레이아웃에 상시 배치하되 로그인/채팅목록/채팅방 페이지에서는 숨긴다.
 * 링크는 항상 /chat — 비로그인이면 /chat 의 requireUser 가드가 로그인으로 유도한다.
 *
 * 위치: 메인(/)에는 등록(+) FAB 가 있으므로 그 위에 세로 스택으로 올린다.
 *       등록 버튼이 없는 다른 페이지에서는 맨 아래(등록 버튼 자리)로 내려온다.
 *
 * 안 읽음 빨간 점: 현재 스키마의 unread 카운트/is_read 가 어디서도 갱신되지 않아
 *   신뢰할 수 없으므로 미구현(보고 참고).
 */
export function FloatingChatButton() {
  const pathname = usePathname();

  const hidden =
    pathname === "/login" ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/");
  if (hidden) return null;

  // 메인에는 등록(+) FAB(bottom-6, 56px)가 있어 그 위로 스택. 그 외엔 맨 아래.
  const onHome = pathname === "/";

  return (
    <a
      href="/chat"
      aria-label="채팅"
      title="채팅"
      className={
        "fixed right-6 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full border-[0.5px] border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg " +
        (onHome ? "bottom-[5.75rem]" : "bottom-6")
      }
    >
      <MessageCircle
        size={24}
        style={{ color: "#0E7C8C" }}
        aria-hidden="true"
      />
    </a>
  );
}
