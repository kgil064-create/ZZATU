"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface UpdateNicknameResult {
  success: boolean;
  error?: string;
  nickname?: string;
}

/**
 * 닉네임 수정 Server Action. (Phase 4)
 *
 * 서버에서 본인 profiles 행만 수정한다. trim 후 2~20자 검증. 성공 시 헤더(layout)·
 * 마이페이지를 revalidate 한다.
 */
export async function updateNickname(
  raw: string,
): Promise<UpdateNicknameResult> {
  const nickname = raw.trim();
  if (nickname.length < 2 || nickname.length > 20) {
    return { success: false, error: "닉네임은 2~20자로 입력해주세요" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id);
  if (error) return { success: false, error: "닉네임 변경에 실패했습니다" };

  revalidatePath("/", "layout"); // 헤더(공통 레이아웃) 갱신
  revalidatePath("/mypage");
  return { success: true, nickname };
}
