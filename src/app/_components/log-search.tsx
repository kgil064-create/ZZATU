"use client";

import { useEffect, useRef } from "react";

import { logSearch } from "@/app/actions/search";

/**
 * 검색 결과 렌더 후 검색 기록. (그룹6 · 지표)
 *
 * 검색어(keyword)가 있을 때만, 실제 결과 수(count)와 함께 log_search RPC 를 호출한다.
 * sessionStorage 'search:<keyword>' 로 같은 검색어 세션당 1회만 기록(새로고침 노이즈 방지).
 * ref 가드로 Strict Mode 이중 마운트를 막는다. UI 없음, fire-and-forget.
 */
export function LogSearch({
  keyword,
  count,
}: {
  keyword: string;
  count: number;
}) {
  const done = useRef(false);

  useEffect(() => {
    if (!keyword) return;
    if (done.current) return;
    done.current = true;

    const key = `search:${keyword}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage 접근 불가면 중복 판단 불가 → 기록 생략.
      return;
    }
    void logSearch(keyword, count).catch(() => {});
  }, [keyword, count]);

  return null;
}
