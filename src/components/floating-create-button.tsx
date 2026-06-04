"use client";

import { usePathname } from "next/navigation";

/**
 * 우측 하단 플로팅 자재 등록 버튼(FAB).
 *
 * 등록 페이지(/items/new)에서는 숨긴다(이미 그 화면에 있으므로). 비로그인 사용자도
 * 그대로 이동시키고, 등록 페이지의 requireUser 가드가 인증을 처리한다.
 * lucide-react 미설치라 + 아이콘은 인라인 SVG 로 둔다(의존성 추가 보류).
 */
export function FloatingCreateButton() {
  const pathname = usePathname();
  if (pathname === "/items/new") return null;

  return (
    <a
      href="/items/new"
      aria-label="자재 등록"
      title="자재 등록"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-6 w-6"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </a>
  );
}
