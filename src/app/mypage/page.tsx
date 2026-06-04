// 마이페이지. (Phase 4 · 4-A · Server Component)
//
// requireUser 가드 후 프로필(닉네임) + 내가 올린 글을 보여준다.
// 닉네임은 profiles.nickname 단일 소스에서 읽는다(헤더와 동일).

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MyItems } from "./_components/my-items";
import { ProfileSection } from "./_components/profile-section";
import { RecentViews } from "./_components/recent-views";

export default async function MyPage() {
  const user = await requireUser("/mypage");
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();
  const nickname =
    (data?.nickname as string | undefined) ?? user.email ?? "회원";

  return (
    <main className="mx-auto w-full max-w-screen-md space-y-8 px-4 py-6">
      <ProfileSection nickname={nickname} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          내가 올린 글
        </h2>
        <MyItems userId={user.id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          최근 본 글
        </h2>
        <RecentViews userId={user.id} />
      </section>
    </main>
  );
}
