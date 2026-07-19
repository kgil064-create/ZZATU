"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 최근 본 글 기록. (Phase 4 · 4-B)
 *
 * 로그인 유저면 item_views 에 upsert(같은 글 재조회는 viewed_at 만 갱신). 비로그인은
 * no-op. 상세 조회 흐름을 막지 않도록 실패해도 조용히 넘어간다(fire-and-forget).
 */
export async function recordView(itemId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // 비로그인 no-op

  await supabase.from("item_views").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );
}

/**
 * 조회수 +1. (그룹6 · 지표)
 *
 * item_views(최근 본 글, 로그인 전용)와 분리된 총 조회수 카운터. increment_view_count RPC
 * 는 SECURITY DEFINER 라 items RLS 를 열지 않고도 증가시킨다. 비로그인도 호출 가능.
 * 본인 매물 제외·세션당 1회 중복 방지는 호출부(record-view.tsx)에서 처리한다.
 * fire-and-forget: 실패해도 조용히 넘어간다.
 */
export async function incrementView(itemId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_view_count", { p_item_id: itemId });
}
