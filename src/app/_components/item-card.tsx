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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
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
