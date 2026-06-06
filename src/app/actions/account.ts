"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export interface WithdrawResult {
  error?: string;
}

/**
 * 버킷에서 prefix(보통 userId) 아래 모든 객체를 재귀적으로 삭제한다. (best-effort)
 *
 * Storage 는 DB FK cascade 로 정리되지 않으므로 탈퇴 시 직접 지운다.
 * - item-images: `{userId}/파일`        (2단)
 * - chat-images: `{userId}/{roomId}/파일` (3단) → 폴더 재귀 필요
 * list 는 폴더(id=null)와 파일을 함께 돌려준다. 폴더면 재귀, 파일이면 모아서 remove.
 */
async function removeAllUnderPrefix(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<void> {
  const { data: entries } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (!entries || entries.length === 0) return;

  const files: string[] = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      await removeAllUnderPrefix(supabase, bucket, path); // 폴더 → 재귀
    } else {
      files.push(path);
    }
  }
  if (files.length > 0) {
    await supabase.storage.from(bucket).remove(files);
  }
}

/**
 * 회원 탈퇴: 계정 + 모든 데이터 완전 삭제. (service role 키 미사용)
 *
 * 순서가 중요: ① Storage 정리(아직 세션·RLS 유효할 때) → ② delete_user() RPC(계정+DB
 * cascade) → ③ signOut → 홈. RPC 로 auth.users 가 사라지면 더는 Storage 를 본인으로
 * 정리할 수 없으므로 반드시 Storage 를 먼저 한다.
 */
export async function withdrawAccount(): Promise<WithdrawResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  // ① Storage 정리 (cascade 안 됨) — best-effort: 실패해도 계정 삭제는 진행
  try {
    await removeAllUnderPrefix(supabase, "item-images", user.id);
    await removeAllUnderPrefix(supabase, "chat-images", user.id);
  } catch {
    // 무시(베스트 에포트)
  }

  // ② 계정 + 모든 DB 데이터 삭제 (auth.users → FK cascade)
  const { error } = await supabase.rpc("delete_user");
  if (error) {
    return { error: "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  // ③ 로그아웃 후 홈으로
  await supabase.auth.signOut();
  redirect("/");
}
