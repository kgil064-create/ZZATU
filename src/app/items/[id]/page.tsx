// 자재 상세 페이지. (Phase 3 · Server Component)
//
// 보안: contact_phone 은 이 쿼리에서 선택하지 않는다(초기 HTML 비노출, 결정 #1).
// 전화번호는 CallButton 의 revealPhone 액션에서만 받아 tel: 로 연결한다.

import type { Metadata } from "next";
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
import {
  CommentSection,
  type ItemComment,
} from "./_components/comment-section";
import { OwnerControls } from "./_components/owner-controls";
import { PhotoGallery } from "./_components/photo-gallery";
import { RecordView } from "./_components/record-view";

/**
 * 매물별 동적 메타데이터. (SEO)
 *
 * 제목 + 지역 + 가격으로 title/description 을 만들어 개별 매물이 검색에 걸리게 한다.
 * OG 이미지는 루트 opengraph-image.tsx(파일 컨벤션)를 그대로 상속(여기서 이미지 미지정).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("title, price, price_option, type, regions(eupmyeondong)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return {}; // 없는 매물 → 레이아웃 기본 메타 사용

  const item = data as unknown as {
    title: string;
    price: number | null;
    price_option: PriceOption;
    type: TradeType;
    regions: { eupmyeondong: string } | null;
  };
  const region = item.regions?.eupmyeondong ?? "제주";
  const priceText = formatPrice(item);
  const title = `${item.title} · ${region} · ${priceText}`;
  const description = `${region}에서 거래하는 건축자재 '${item.title}' (${priceText}). 제주 건축자재·자투리 거래는 짜투.`;

  return { title, description, openGraph: { title, description } };
}

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

/** comments + profiles 조인 원본 행. 화면에 넘길 땐 nickname 만 남긴다. */
interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { nickname: string } | null;
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

  // 댓글은 '구해요'에만 노출한다. 다른 유형은 쿼리 자체를 만들지 않는다.
  // (item.type 을 알아야 판정되므로 위 Promise.all 에는 넣을 수 없다 — 대신 찜 조회와 묶는다.)
  const isRequest = item.type === "request";

  const [favResult, commentsResult] = await Promise.all([
    user
      ? supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("item_id", item.id)
          .maybeSingle()
      : null,
    isRequest
      ? supabase
          .from("comments")
          .select("id, content, created_at, user_id, profiles(nickname)")
          .eq("item_id", item.id)
          .order("created_at", { ascending: true })
      : null,
  ]);

  // 찜 여부(로그인 시) + 하트 노출 여부(비로그인 또는 남의 글)
  const favorited = !!favResult?.data;
  const showFavorite = !user || !isOwner;

  // profiles 조인 결과를 nickname 하나로 펴서 클라이언트 컴포넌트에 넘긴다.
  const comments: ItemComment[] = (
    (commentsResult?.data ?? []) as unknown as CommentRow[]
  ).map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    nickname: c.profiles?.nickname ?? null,
  }));

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

      {/* 댓글은 '구해요'에만. isOwner 조건부 블록 바깥 — 주인도 답글을 단다. */}
      {isRequest && (
        <CommentSection
          itemId={item.id}
          ownerId={item.user_id}
          myId={user?.id ?? null}
          comments={comments}
        />
      )}
    </main>
  );
}
