import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import type { TradeType } from "@/lib/format";
import { FloatingCreateButton } from "@/components/floating-create-button";
import { InstallBanner } from "@/components/install-banner";
import { FilterPanel } from "./_components/filter-panel";
import { ItemList, ItemListSkeleton } from "./_components/item-list";
import { SearchBar } from "./_components/search-bar";
import { TypeTabs } from "./_components/type-tabs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const rawType = typeof sp.type === "string" ? sp.type : undefined;
  const type: TradeType | undefined =
    rawType === "sell" || rawType === "free" || rawType === "request"
      ? rawType
      : undefined;

  const q = typeof sp.q === "string" ? sp.q : undefined;

  const rawCategory = typeof sp.category === "string" ? sp.category : undefined;
  const category =
    rawCategory && /^\d+$/.test(rawCategory) ? Number(rawCategory) : undefined;

  const rawRegion = typeof sp.region === "string" ? sp.region : undefined;
  const region:
    | "jeju"
    | "seogwipo"
    | "east"
    | "west"
    | "all"
    | undefined =
    rawRegion === "jeju" ||
    rawRegion === "seogwipo" ||
    rawRegion === "east" ||
    rawRegion === "west" ||
    rawRegion === "all"
      ? rawRegion
      : undefined;

  // 필터 옵션(마스터) 조회
  const supabase = await createClient();
  const [categoriesResult, regionsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("display_order"),
    supabase
      .from("regions")
      .select("si, eupmyeondong")
      .lt("display_order", 100)
      .order("display_order"),
  ]);
  const categories = (categoriesResult.data ?? []) as {
    id: number;
    name: string;
  }[];
  const regions = (regionsResult.data ?? []) as {
    si: string;
    eupmyeondong: string;
  }[];

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-4">
      {/* 홈 화면 추가 안내. 여백(mb-3)은 컴포넌트가 직접 가진다 —
          숨겨질 때 빈 공간이 남지 않게 하려는 것. */}
      <InstallBanner />

      {/* useSearchParams 를 쓰는 클라이언트 컴포넌트는 Suspense 로 감싼다. */}
      <Suspense>
        <SearchBar />
        <div className="mt-3">
          <TypeTabs />
        </div>
        <div className="mt-3">
          <FilterPanel categories={categories} regions={regions} />
        </div>
      </Suspense>
      {/* 목록은 DB 조회를 기다린다 — Suspense 로 끊어 검색·필터 UI 가 먼저 뜨게 한다.
          key 에 필터 조합을 넣는 건 의도적이다: 필터가 바뀌면 경계가 새로 마운트되면서
          스켈레톤이 다시 보인다(키가 고정이면 이전 목록이 그대로 남아 반응이 없어 보인다). */}
      <div className="mt-4">
        <Suspense
          key={`${type ?? ""}|${q ?? ""}|${category ?? ""}|${region ?? ""}`}
          fallback={<ItemListSkeleton />}
        >
          <ItemList type={type} q={q} category={category} region={region} />
        </Suspense>
      </div>

      {/* 메인 목록에서만 노출되는 자재 등록 FAB */}
      <FloatingCreateButton />
    </main>
  );
}
