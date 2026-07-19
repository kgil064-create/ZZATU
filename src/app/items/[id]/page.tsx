// 자재 상세 페이지. (Phase 3 · Server Component)
//
// 보안: contact_phone 은 이 쿼리에서 선택하지 않는다(초기 HTML 비노출, 결정 #1).
// 전화번호는 CallButton 의 revealPhone 액션에서만 받아 tel: 로 연결한다.

import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { FavoriteButton } from "@/components/favorite-button";
import {
  VIEW_COUNT_THRESHOLD,
  FAVORITE_COUNT_THRESHOLD,
} from "@/lib/constants";
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
  view_count: number;
  favorite_count: number;
  description: string | null;
  transport_options: string[];
  delivery_option: "available" | "unavailable" | "negotiable" | null;
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
        "id, user_id, type, title, price, price_option, is_sold, created_at, view_count, favorite_count, description, transport_options, delivery_option, regions(eupmyeondong), item_images(url, display_order), item_categories(categories(name))",
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

  // 지표 노출: 문턱 이상일 때만. 둘 다 미달이면 아무 것도 렌더하지 않는다.
  const showViews = item.view_count >= VIEW_COUNT_THRESHOLD;
  const showFavorites = item.favorite_count >= FAVORITE_COUNT_THRESHOLD;

  // 배송 여부: 선택된 경우에만 표시(미선택이면 렌더 안 함).
  const deliveryLabel = item.delivery_option
    ? {
        available: "배송 가능",
        unavailable: "배송 불가",
        negotiable: "배송 협의",
      }[item.delivery_option]
    : null;

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-4">
      {/* 최근 본 글(로그인 전용, 서버 no-op) + 조회수(비로그인 포함, 본인 제외·세션당 1회). */}
      <RecordView itemId={item.id} isOwner={isOwner} />

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
          {showViews && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-xs text-gray-500">
                조회 {item.view_count}
              </span>
            </>
          )}
          {showFavorites && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-xs text-gray-500">
                찜 {item.favorite_count}
              </span>
            </>
          )}
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

      {deliveryLabel && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-foreground">배송</h2>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground">
            {deliveryLabel}
          </span>
        </div>
      )}

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
