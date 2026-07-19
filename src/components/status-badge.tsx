import type { TradeType } from "@/lib/format";
import {
  ITEM_TYPE_LABELS,
  ITEM_TYPE_COLORS,
  SOLD_LABEL,
  SOLD_BADGE_STYLE,
} from "@/lib/constants";

interface StatusBadgeProps {
  type: TradeType;
  isSold: boolean; // 거래완료(items.is_sold)
}

/**
 * 거래상태 pill 배지. 목록·상세가 공유한다. (Phase 3)
 *
 * 거래완료면 거래종류와 무관하게 회색 "거래완료". 아니면 거래종류별 라벨·색.
 * 라벨/색은 lib/constants 의 ITEM_TYPE_LABELS · ITEM_TYPE_COLORS 단일 소스.
 */
export function StatusBadge({ type, isSold }: StatusBadgeProps) {
  const { label, bg, text } = isSold
    ? { label: SOLD_LABEL, bg: SOLD_BADGE_STYLE.bg, text: SOLD_BADGE_STYLE.text }
    : {
        label: ITEM_TYPE_LABELS[type],
        bg: ITEM_TYPE_COLORS[type].badgeBg,
        text: ITEM_TYPE_COLORS[type].badgeText,
      };

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}
