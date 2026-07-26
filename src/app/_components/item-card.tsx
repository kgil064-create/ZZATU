import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { FavoriteButton } from "@/components/favorite-button";
import {
  formatPrice,
  formatRelativeTime,
  type PriceOption,
  type TradeType,
} from "@/lib/format";

export interface ItemCardData {
  id: string;
  user_id: string;
  type: TradeType;
  title: string;
  price: number | null;
  price_option: PriceOption;
  is_sold: boolean;
  created_at: string;
  // 매핑: regions.eupmyeondong = 지역 표시명 (regions 에 name 컬럼 없음)
  regions: { eupmyeondong: string } | null;
  item_images: { url: string; display_order: number }[];
}

/**
 * 목록 카드 1개의 로딩 자리표시자.
 *
 * 아래 ItemCard 와 **같은 골격·같은 여백**을 쓴다. 각 텍스트 줄은 실제와 동일한
 * 타이포 클래스(text-sm / text-xs / text-[13px])에 text-transparent + 배경을 얹어
 * 만든다 — 임의 높이를 찍지 않으므로 줄 높이가 실제 카드와 정확히 일치하고,
 * 스켈레톤이 실제 카드로 바뀔 때 세로 이동이 없다.
 */
export function ItemCardSkeleton() {
  return (
    <div className="relative animate-pulse" aria-hidden="true">
      <div className="flex gap-3 rounded-base border border-border bg-card p-3 shadow-sm">
        {/* 썸네일 자리 — 실제와 같은 96px(h-24 w-24) */}
        <div className="h-24 w-24 shrink-0 rounded-base bg-border" />

        <div className="flex min-w-0 flex-1 flex-col">
          <div>
            <span className="inline-flex items-center rounded-full bg-border px-3 py-1 text-[13px] font-medium text-transparent">
              판매중
            </span>
          </div>
          <h3 className="mt-1 w-2/3 truncate rounded-md bg-border text-sm font-medium text-transparent">
            제목 자리표시자
          </h3>
          <p className="mt-1 w-1/3 truncate rounded-md bg-border text-sm font-semibold text-transparent">
            가격
          </p>
          <div className="mt-auto flex items-center gap-1 pt-1 text-xs">
            <span className="w-24 truncate rounded-md bg-border text-transparent">
              지역 · 시간
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 목록 카드 1개. (Phase 3 / 찜 추가)
 *
 * 카드 전체가 상세로 가는 Link. 거래완료면 dim. 찜 하트는 카드 우상단에 Link 의 형제로
 * 올려(앵커 안 버튼 중첩 방지) 클릭이 상세 이동과 겹치지 않게 한다.
 * 하트는 비로그인 또는 (로그인 & 남의 글)일 때만 노출(본인 글엔 숨김).
 */
export function ItemCard({
  item,
  currentUserId,
  favorited,
}: {
  item: ItemCardData;
  currentUserId?: string | null;
  favorited?: boolean;
}) {
  const thumb =
    [...item.item_images].sort((a, b) => a.display_order - b.display_order)[0]
      ?.url ?? null;
  const region = item.regions?.eupmyeondong ?? "";
  const showFavorite = currentUserId
    ? currentUserId !== item.user_id
    : true; // 로그인+본인 글이면 숨김, 그 외엔 노출

  return (
    <div className="relative">
      <Link
        href={`/items/${item.id}`}
        className={
          "flex gap-3 rounded-base border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted " +
          (item.is_sold ? "opacity-60" : "")
        }
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-base bg-muted">
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              width={96}
              height={96}
              sizes="96px"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              사진 없음
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div>
            <StatusBadge type={item.type} isSold={item.is_sold} />
          </div>
          <h3 className="mt-1 truncate pr-8 text-sm font-medium text-foreground">
            {item.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatPrice(item)}
          </p>
          <div className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted-foreground">
            {region && (
              <>
                <span className="truncate">{region}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="shrink-0">
              {formatRelativeTime(item.created_at)}
            </span>
          </div>
        </div>
      </Link>

      {showFavorite && (
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton itemId={item.id} initialFavorited={!!favorited} />
        </div>
      )}
    </div>
  );
}
