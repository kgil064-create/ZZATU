"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface ToggleFavoriteResult {
  favorited?: boolean;
  error?: string;
}

/**
 * 찜 토글. (Phase: 찜)
 *
 * 본인 찜이 있으면 삭제, 없으면 추가. user_id 는 서버의 getUser() 로만 채워(클라이언트
 * 입력 불신), RLS(auth.uid()=user_id) 가 한 번 더 본인만 허용한다. 비로그인은
 * "unauthenticated" 반환(클라이언트가 로그인 유도).
 */
export async function toggleFavorite(
  itemId: string,
): Promise<ToggleFavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: "찜 해제에 실패했어요" };
    revalidatePath("/mypage");
    return { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, item_id: itemId });
  if (error) return { error: "찜에 실패했어요" };
  revalidatePath("/mypage");
  return { favorited: true };
}
