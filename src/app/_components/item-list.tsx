import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { TradeType } from "@/lib/format";
import { ItemCard, type ItemCardData } from "./item-card";

function EmptyState({ filtering }: { filtering: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-base border border-border bg-card px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">
        {filtering ? "검색 결과가 없어요" : "아직 등록된 자재가 없어요"}
      </p>
      {!filtering && (
        <Link
          href="/items/new"
          className="rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          자재 등록하기
        </Link>
      )}
    </div>
  );
}

/**
 * 메인 아이템 목록. (Phase 3 / Phase 6 검색·필터 · Server Component)
 *
 * type(거래종류) + q(키워드) + category(카테고리) + region(지역 규칙)을 함께 적용.
 * 정렬은 거래완료(is_sold) 뒤로 + 최신순. 필터로 0건이면 "검색 결과가 없어요".
 */
export async function ItemList({
  type,
  q,
  category,
  region,
}: {
  type?: TradeType;
  q?: string;
  category?: number;
  region?: "jeju" | "seogwipo" | "all";
}) {
  const supabase = await createClient();

  // q: .or 필터에 들어가므로 와일드카드(%,_)·구분자(,)·괄호·역슬래시를 공백으로 치환.
  const safeQ = q
    ? q
        .replace(/[%_,()\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  const filtering = Boolean(type || safeQ || category || region);

  // 카테고리: 임베드 필터 대신 item_categories 에서 item_id 를 모아 .in 으로 분리(실측 우선).
  let categoryItemIds: string[] | null = null;
  if (category != null) {
    const { data: ic } = await supabase
      .from("item_categories")
      .select("item_id")
      .eq("category_id", category);
    categoryItemIds = (ic ?? []).map((r) => (r as { item_id: string }).item_id);
    if (categoryItemIds.length === 0) return <EmptyState filtering />;
  }

  // 지역 규칙: 시(市) 선택 시 그 시 + 'all'(제주전체) 포함. region_id 목록을 구해 .in.
  let regionIds: number[] | null = null;
  if (region) {
    const siList =
      region === "jeju"
        ? ["jeju", "all"]
        : region === "seogwipo"
          ? ["seogwipo", "all"]
          : ["all"];
    const { data: regs } = await supabase
      .from("regions")
      .select("id")
      .in("si", siList)
      .lt("display_order", 100);
    regionIds = (regs ?? []).map((r) => (r as { id: number }).id);
    if (regionIds.length === 0) return <EmptyState filtering />;
  }

  let query = supabase
    .from("items")
    .select(
      "id, type, title, price, price_option, is_sold, created_at, regions(eupmyeondong), item_images(url, display_order)",
    )
    .order("is_sold", { ascending: true })
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (safeQ) {
    query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
  }
  if (categoryItemIds) query = query.in("id", categoryItemIds);
  if (regionIds) query = query.in("region_id", regionIds);

  const { data, error } = await query;
  const items = (data ?? []) as unknown as ItemCardData[];

  if (error || items.length === 0) return <EmptyState filtering={filtering} />;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
