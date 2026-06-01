/**
 * Server Component 에서 현재 로그인한 사용자를 가져오는 헬퍼.
 *
 * 이 단계에서는 getUser() 만 만든다.
 * requireUser() 가드는 Phase 1 의 8단계에서 추가한다.
 */
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
