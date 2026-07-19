import Link from "next/link";

/**
 * 우측 하단 플로팅 자재 등록 버튼(FAB).
 *
 * 메인 목록(/)에서만 노출한다 — 홈 페이지(app/page.tsx)에서만 렌더되므로 별도 경로 분기가
 * 필요 없다(검색 결과 /?q=... 도 pathname 이 / 라 그대로 노출). 비로그인도 그대로 이동시키고,
 * /items/new 의 requireUser 가 인증을 처리한다. + 아이콘은 인라인 SVG.
 */
export function FloatingCreateButton() {
  return (
    <Link
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
    </Link>
  );
}
