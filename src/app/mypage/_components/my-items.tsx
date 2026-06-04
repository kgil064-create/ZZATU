import { createClient } from "@/lib/supabase/server";
import { ItemCard, type ItemCardData } from "@/app/_components/item-card";

/**
 * 내가 올린 글 목록. (Phase 4 · Server Component)
 *
 * item-card 재사용. 정렬은 거래완료(is_sold) 뒤로 + 최신순. 없으면 빈 화면.
 */
export async function MyItems({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select(
      "id, type, title, price, price_option, is_sold, created_at, regions(eupmyeondong), item_images(url, display_order)",
    )
    .eq("user_id", userId)
    .order("is_sold", { ascending: true })
    .order("created_at", { ascending: false });

  const items = (data ?? []) as unknown as ItemCardData[];

  if (error || items.length === 0) {
    return (
      <div className="rounded-base border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
        아직 올린 자재가 없어요
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
