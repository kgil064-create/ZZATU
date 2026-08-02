"use client";

import { useEffect, useRef } from "react";

const MESSAGE = "작성 중인 내용이 사라집니다. 나가시겠어요?";

/**
 * 폼 작성 중 이탈 방지 가드. (iOS 이슈 A-1)
 *
 * `active`(작성 시작=dirty & 제출 중 아님)일 때만 동작한다.
 *  - beforeunload: 브라우저 새로고침/탭 닫기/하드 이동 시 기본 경고.
 *  - 앵커 클릭(캡처 단계): 앱 내 <Link>/<a> 이동 시 confirm — 취소하면 이동 차단.
 *  - popstate: 브라우저/제스처 뒤로. active 동안만 sentinel 히스토리로 가로채 confirm.
 *
 * ⚠️ Next App Router 는 공식 라우팅 차단 API 가 없어, 앵커 클릭 가로채기 + popstate
 *    sentinel 조합으로 처리한다(router.push 로직 이동은 별도).
 */
export function useUnsavedGuard(active: boolean) {
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // beforeunload + 앵커 클릭 캡처는 마운트~언마운트 상시 등록(내부에서 activeRef 확인).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!activeRef.current) return;
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  // popstate(뒤로/제스처) — active 동안만 sentinel 로 가로챈다.
  useEffect(() => {
    if (!active) return;
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      if (window.confirm(MESSAGE)) {
        window.removeEventListener("popstate", onPop);
        window.history.back(); // 확인 → 실제로 이전 페이지로 이동
      } else {
        window.history.pushState(null, "", window.location.href); // 취소 → 머무름
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [active]);
}
