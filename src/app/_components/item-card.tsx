import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import {
  formatPrice,
  formatRelativeTime,
  type PriceOption,
  type TradeType,
} from "@/lib/format";

export interface ItemCardData {
  id: string;
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
 * 목록 카드 1개. (Phase 3)
 *
 * 카드 전체가 상세로 가는 Link. 좌측 정사각 썸네일(첫 사진, display_order 최소) +
 * 우측 정보(상태 배지·제목·가격·지역·상대시간). 거래완료면 카드 전체 dim(결정 #3).
 */
export function ItemCard({ item }: { item: ItemCardData }) {
  const thumb =
    [...item.item_images].sort((a, b) => a.display_order - b.display_order)[0]
      ?.url ?? null;
  const region = item.regions?.eupmyeondong ?? "";

  return (
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
          <img
            src={thumb}
            alt=""
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
        <h3 className="mt-1 truncate text-sm font-medium text-foreground">
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
          <span className="shrink-0">{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
