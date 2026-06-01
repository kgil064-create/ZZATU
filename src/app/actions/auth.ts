"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 헤더 등 layout 레벨 캐시 무효화 — 닉네임이 잔존해 보이는 현상 방지.
  revalidatePath("/", "layout");
  redirect("/");
}
