"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * 헤더 뒤로가기 버튼. (iOS 이슈 C — standalone 갇힘 대응)
 *
 * ⚠️ router.back() 을 쓰지 않는다(히스토리가 없으면 앱을 벗어난다). 대신 경로별
 *    "논리적 상위"로 next/link 이동한다. 홈(최상위)에서는 렌더하지 않는다.
 *
 * <Link>(=<a>)라 등록/수정 폼의 이탈 가드(useUnsavedGuard)가 클릭을 가로채
 * 작성 중이면 confirm 을 띄운다.
 */
function parentPath(pathname: string): string | null {
  if (pathname === "/") return null; // 최상위 — 뒤로 없음
  if (pathname === "/chat") return "/";
  if (pathname.startsWith("/chat/")) return "/chat"; // 채팅방 → 채팅목록
  const edit = pathname.match(/^\/items\/([^/]+)\/edit$/);
  if (edit) return `/items/${edit[1]}`; // 수정 → 그 매물 상세
  if (pathname === "/items/new") return "/"; // 등록 → 홈
  if (pathname.startsWith("/items/")) return "/"; // 상세 → 홈(목록)
  return "/"; // 마이페이지·찜목록·기타 하위 → 홈
}

export function HeaderBackButton() {
  const pathname = usePathname();
  const parent = parentPath(pathname);
  if (!parent) return null;

  return (
    <Link
      href={parent}
      aria-label="뒤로"
      title="뒤로"
      className="-ml-2 flex h-11 w-11 items-center justify-center text-primary transition-colors hover:text-primary-hover"
    >
      <ChevronLeft size={24} aria-hidden="true" />
    </Link>
  );
}
