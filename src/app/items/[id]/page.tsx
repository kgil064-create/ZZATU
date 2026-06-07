// 자재 상세 페이지. (Phase 3 · Server Component)
//
// 보안: contact_phone 은 이 쿼리에서 선택하지 않는다(초기 HTML 비노출, 결정 #1).
// 전화번호는 CallButton 의 revealPhone 액션에서만 받아 tel: 로 연결한다.

import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { FavoriteButton } from "@/components/favorite-button";
import { createClient } from "@/lib/supabase/server";
import {
  formatPrice,
  formatRelativeTime,
  type PriceOption,
  type TradeType,
} from "@/lib/format";
import { CallButton } from "./_components/call-button";
import { ChatButton } from "./_components/chat-button";
import { OwnerControls } from "./_components/owner-controls";
import { PhotoGallery } from "./_components/photo-gallery";
import { RecordView } from "./_components/record-view";

interface DetailItem {
  id: string;
  user_id: string;
  type: TradeType;
  title: string;
  price: number | null;
  price_option: PriceOption;
  is_sold: boolean;
  created_at: string;
  description: string | null;
  transport_options: string[];
  regions: { eupmyeondong: string } | null;
  item_images: { url: string; display_order: number }[];
  item_categories: { categories: { name: string } | null }[];
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [itemResult, transportResult, userResult] = await Promise.all([
    supabase
      .from("items")
      .select(
        "id, user_id, type, title, price, price_option, is_sold, created_at, description, transport_options, regions(eupmyeondong), item_images(url, display_order), item_categories(categories(name))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("transport_options").select("code, name"),
    supabase.auth.getUser(),
  ]);

  const item = itemResult.data as unknown as DetailItem | null;
  if (!item) notFound();

  const user = userResult.data.user;
  const isOwner = !!user && user.id === item.user_id;

  // 찜 여부(로그인 시) + 하트 노출 여부(비로그인 또는 남의 글)
  let favorited = false;
  if (user) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", item.id)
      .maybeSingle();
    favorited = !!fav;
  }
  const showFavorite = !user || !isOwner;

  const images = [...item.item_images]
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => img.url);

  const categories = item.item_categories
    .map((ic) => ic.categories?.name)
    .filter((name): name is string => Boolean(name));

  const transportNameByCode = new Map(
    ((transportResult.data ?? []) as { code: string; name: string }[]).map(
      (t) => [t.code, t.name],
    ),
  );
  const transportLabels = (item.transport_options ?? []).map(
    (code) => transportNameByCode.get(code) ?? code,
  );

  const region = item.regions?.eupmyeondong ?? "";

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-4">
      {/* 로그인 유저면 최근 본 글 기록(본인 글 포함). UI 없음. */}
      {user && <RecordView itemId={item.id} />}

      {images.length > 0 && <PhotoGallery images={images} />}

      <div className="mt-4">
        <div className="flex items-start justify-between gap-2">
          <StatusBadge type={item.type} isSold={item.is_sold} />
          {showFavorite && (
            <FavoriteButton
              itemId={item.id}
              initialFavorited={favorited}
              variant="detail"
            />
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">
          {item.title}
        </h1>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {formatPrice(item)}
        </p>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          {region && (
            <>
              <span>{region}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((name) => (
            <span
              key={name}
              className="rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {item.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {item.description}
        </p>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-foreground">운반 옵션</h2>
        {transportLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {transportLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">운반 협의</p>
        )}
      </div>

      {isOwner && (
        <div className="mt-6">
          <OwnerControls itemId={item.id} isSold={item.is_sold} />
        </div>
      )}

      {!isOwner && (
        <div className="mt-8 flex gap-2">
          {user && (
            <div className="flex-1">
              <ChatButton itemId={item.id} />
            </div>
          )}
          <div className="flex-1">
            <CallButton itemId={item.id} isSold={item.is_sold} />
          </div>
        </div>
      )}
    </main>
  );
}
