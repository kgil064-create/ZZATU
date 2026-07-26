import { getCachedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface FavoriteContext {
  userId: string | null;
  favoriteItemIds: string[];
}

/**
 * 현재 유저 + 그 유저가 찜한 item_id 목록을 한 번에 가져온다. (서버 전용)
 *
 * 목록/상세에서 "내가 찜했는지" 판단용. 로그아웃이면 { userId: null, [] }.
 * RLS(select: auth.uid()=user_id) 로 본인 찜만 조회된다.
 *
 * 사용자 조회는 getCachedUser() 를 거친다 — 같은 요청에서 헤더가 이미 조회했다면
 * Auth 왕복이 재사용된다.
 */
export async function getFavoriteContext(): Promise<FavoriteContext> {
  const user = await getCachedUser();
  if (!user) return { userId: null, favoriteItemIds: [] };

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("item_id")
    .eq("user_id", user.id);

  return {
    userId: user.id,
    favoriteItemIds: (data ?? []).map((r) => (r as { item_id: string }).item_id),
  };
}
