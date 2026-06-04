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
