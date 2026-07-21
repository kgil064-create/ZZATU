import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://zzatu.vercel.app";

/**
 * sitemap.xml (/sitemap.xml).
 *
 * 정적 공개 페이지 + 공개 매물 상세를 동적으로 포함한다.
 * 매물은 거래완료(is_sold=true)를 제외하고, lastModified 에 items.updated_at 을 넣는다.
 *
 * ⚠️ Supabase 는 쿠키·세션에 의존하는 서버 클라이언트가 아니라 anon(공개) 키만 쓰는
 *    무쿠키 클라이언트로 조회한다. sitemap 은 요청 컨텍스트 밖에서 실행될 수 있어,
 *    cookies() 기반 클라이언트는 여기서 터질 수 있다. items 는 RLS 공개 읽기
 *    (items_select_all: using(true))라 anon 으로도 is_sold=false 행을 읽는다.
 *    (이 프로젝트의 공개 키 환경변수명은 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 *
 * 매물 조회가 실패해도 정적 페이지는 항상 반환하도록 try/catch 로 감싼다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let itemRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data } = await supabase
      .from("items")
      .select("id, updated_at")
      .eq("is_sold", false)
      .order("updated_at", { ascending: false })
      .limit(5000);

    itemRoutes = ((data ?? []) as { id: string; updated_at: string }[]).map(
      (item) => ({
        url: `${BASE_URL}/items/${item.id}`,
        lastModified: new Date(item.updated_at),
        changeFrequency: "daily",
        priority: 0.7,
      }),
    );
  } catch {
    // 매물 조회 실패 시에도 정적 페이지만이라도 sitemap 을 반환한다(전체 500 방지).
    itemRoutes = [];
  }

  return [...staticRoutes, ...itemRoutes];
}
