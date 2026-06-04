/**
 * Server Component 에서 사용하는 인증 헬퍼.
 *
 * - getUser()                : 로그인된 사용자 또는 null 반환. UI 분기용.
 * - requireUser(redirectTo)  : 보호 페이지용 가드. 비로그인 시
 *                              `/login?redirect=<redirectTo>` 로 강제 이동.
 */
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser(redirectTo: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

export interface Profile {
  id: string;
  nickname: string;
}

/**
 * 현재 로그인 유저의 프로필(닉네임 포함)을 반환한다. (Phase 4)
 *
 * 헤더·마이페이지가 같은 소스(profiles.nickname)를 쓰도록 단일화한다.
 * 비로그인이면 null. 프로필 행이 없으면 이메일/'회원' 으로 폴백한다.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  const nickname =
    (data?.nickname as string | undefined) ?? user.email ?? "회원";
  return { id: user.id, nickname };
}
