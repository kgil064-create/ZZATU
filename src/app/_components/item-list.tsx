import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { TradeType } from "@/lib/format";
import { ItemCard, type ItemCardData } from "./item-card";

/**
 * 메인 아이템 목록. (Phase 3 · Server Component)
 *
 * 정렬: 거래완료(is_sold)를 뒤로, 그 안에서 created_at 내림차순.
 * type 이 주어지면 해당 거래종류만, 없으면 전체. 비었으면 빈 화면 + 등록 유도.
 */
export async function ItemList({ type }: { type?: TradeType }) {
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

  const { data, error } = await query;
  const items = (data ?? []) as unknown as ItemCardData[];

  if (error || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-base border border-border bg-card px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          아직 등록된 자재가 없어요
        </p>
        <Link
          href="/items/new"
          className="rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          자재 등록하기
        </Link>
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
