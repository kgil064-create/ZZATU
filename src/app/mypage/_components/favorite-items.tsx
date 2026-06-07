import { createClient } from "@/lib/supabase/server";
import { ItemCard, type ItemCardData } from "@/app/_components/item-card";

/**
 * 찜한 매물 목록. (Phase: 찜 · Server Component)
 *
 * favorites → items 조인, 최근 찜 순. item-card 재사용. 모두 찜한 상태(favorited=true).
 * 삭제된 매물은 FK cascade 로 favorites 행이 사라져 자동 제외.
 */
export async function FavoriteItems({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select(
      "created_at, items(id, user_id, type, title, price, price_option, is_sold, created_at, regions(eupmyeondong), item_images(url, display_order))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const items = ((data ?? []) as unknown as { items: ItemCardData | null }[])
    .map((row) => row.items)
    .filter((item): item is ItemCardData => item !== null);

  if (error || items.length === 0) {
    return (
      <div className="rounded-base border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
        찜한 매물이 없어요
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} currentUserId={userId} favorited />
        </li>
      ))}
    </ul>
  );
}
