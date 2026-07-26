/**
 * Server Component 에서 사용하는 인증 헬퍼.
 *
 * - getCachedUser()          : 요청 단위로 메모이즈된 사용자 조회. 아래 헬퍼들의 기반.
 * - getUser()                : 로그인된 사용자 또는 null 반환. UI 분기용.
 * - requireUser(redirectTo)  : 보호 페이지용 가드. 비로그인 시
 *                              `/login?redirect=<redirectTo>` 로 강제 이동.
 */
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * 현재 로그인 사용자. **한 요청(렌더 패스) 안에서 1회만** 실제 조회한다.
 *
 * supabase.auth.getUser() 는 로컬 JWT 디코딩이 아니라 Auth 서버로의 네트워크
 * 왕복이다. 헤더(getProfile)·목록(getFavoriteContext) 등 여러 컴포넌트가 각자
 * 호출하면 같은 요청에서 왕복이 중복된다. React cache() 로 감싸 첫 호출의
 * 프라미스를 공유하게 만들어 요청당 1회로 합친다.
 *
 * 주의: 세션 상태에 의존하므로 요청 경계를 넘어 캐시되면 안 된다 — cache() 는
 * 렌더 패스 단위이므로 그 조건을 만족한다("use cache" 와 혼동하지 말 것).
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

export async function getUser(): Promise<User | null> {
  return getCachedUser();
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
  const user = await getCachedUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  const nickname =
    (data?.nickname as string | undefined) ?? user.email ?? "회원";
  return { id: user.id, nickname };
}
