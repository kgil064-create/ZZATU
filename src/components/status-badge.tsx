import type { TradeType } from "@/lib/format";

interface StatusBadgeProps {
  type: TradeType;
  isSold: boolean; // 거래완료(items.is_sold)
}

/**
 * 거래상태 pill 배지. 목록·상세가 공유한다. (Phase 3)
 *
 * 거래완료면 거래종류와 무관하게 회색 "거래완료". 아니면 거래종류 색:
 *   구해요=파랑 / 나눔=초록 / 판매중=딥블루(primary).
 * 색은 globals.css 의 status-* 토큰을 사용한다(판매중은 primary 틴트).
 */
const TYPE_STYLE: Record<TradeType, { label: string; className: string }> = {
  request: {
    label: "구해요",
    className: "bg-status-request-bg text-status-request",
  },
  free: {
    label: "나눔",
    className: "bg-status-free-bg text-status-free",
  },
  sell: {
    label: "판매중",
    className: "bg-primary/10 text-primary",
  },
};

export function StatusBadge({ type, isSold }: StatusBadgeProps) {
  const { label, className } = isSold
    ? { label: "거래완료", className: "bg-muted text-muted-foreground" }
    : TYPE_STYLE[type];

  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium " +
        className
      }
    >
      {label}
    </span>
  );
}
