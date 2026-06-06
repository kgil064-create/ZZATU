import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { TradeType } from "@/lib/format";
import { ItemCard, type ItemCardData } from "./item-card";

/**
 * 메인 아이템 목록. (Phase 3 / Phase 6 검색 반영 · Server Component)
 *
 * 정렬: 거래완료(is_sold)를 뒤로, 그 안에서 created_at 내림차순.
 * type(거래종류) + q(제목·설명 키워드)를 함께 적용. 결과 0건이면 상태에 맞는 빈 화면.
 */
export async function ItemList({ type, q }: { type?: TradeType; q?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select(
      "id, type, title, price, price_option, is_sold, created_at, regions(eupmyeondong), item_images(url, display_order)",
    )
    .order("is_sold", { ascending: true })
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  // q: .or 필터에 들어가므로 와일드카드(%,_)·구분자(,)·괄호·역슬래시를 공백으로 치환해
  // 문법 깨짐과 와일드카드 주입을 막는다.
  const safeQ = q
    ? q
        .replace(/[%_,()\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  if (safeQ) {
    query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
  }

  const { data, error } = await query;
  const items = (data ?? []) as unknown as ItemCardData[];

  if (error || items.length === 0) {
    const filtering = Boolean(type || safeQ);
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
