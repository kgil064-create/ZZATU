import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components, Route Handlers, Server Actions 에서 사용.
// Next.js 16: cookies() 는 async — 반드시 await.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 에서 set 호출 시 발생할 수 있음 — proxy 가 세션 갱신을 책임지므로 무시.
          }
        },
      },
    },
  );
}
