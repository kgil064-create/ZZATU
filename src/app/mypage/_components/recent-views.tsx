import { createClient } from "@/lib/supabase/server";
import { ItemCard, type ItemCardData } from "@/app/_components/item-card";

/**
 * 최근 본 글 목록. (Phase 4 · 4-B · Server Component)
 *
 * item_views join items, viewed_at 내림차순 LIMIT 30. item-card 재사용.
 * 삭제된 글은 FK cascade 로 item_views 행 자체가 사라져 자동 제외된다.
 */
export async function RecentViews({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("item_views")
    .select(
      "viewed_at, items(id, type, title, price, price_option, is_sold, created_at, regions(eupmyeondong), item_images(url, display_order))",
    )
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(30);

  const items = ((data ?? []) as unknown as { items: ItemCardData | null }[])
    .map((row) => row.items)
    .filter((item): item is ItemCardData => item !== null);

  if (error || items.length === 0) {
    return (
      <div className="rounded-base border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
        최근 본 글이 없어요
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
