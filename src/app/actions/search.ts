"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 검색 기록. (그룹6 · 지표)
 *
 * log_search RPC(SECURITY DEFINER)로 search_logs 에 keyword·result_count 를 남긴다.
 * 함수 내부에서 auth.uid()(비로그인이면 null)를 user_id 로 넣으므로 비로그인도 기록된다.
 * 중복 방지(같은 검색어 세션당 1회)는 호출부(log-search.tsx)에서 sessionStorage 로 처리.
 * fire-and-forget: 실패해도 조용히 넘어간다.
 */
export async function logSearch(
  keyword: string,
  resultCount: number,
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("log_search", {
    p_keyword: keyword,
    p_result_count: resultCount,
  });
}
