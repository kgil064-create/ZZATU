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
