/**
 * 표시용 포맷 헬퍼. (Phase 3)
 *
 * 컬럼 매핑(items 테이블):
 *   - type         : 'sell' | 'free' | 'request'
 *   - price        : integer | null
 *   - price_option : 'fixed' | 'negotiable' | 'free'  (협의 = 'negotiable')
 *   - is_sold      : boolean (거래완료)
 */

export type TradeType = "sell" | "free" | "request";
export type PriceOption = "fixed" | "negotiable" | "free";

/** formatPrice 가 필요로 하는 최소 형태. */
export interface PriceInput {
  type: TradeType;
  price: number | null;
  price_option: PriceOption;
}

function won(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 거래종류별 가격 문자열.
 *   - 나눔(free)     → "무료"
 *   - 구해요(request) → 협의면 "희망가 협의", 아니면 "희망가 50,000원"
 *   - 판매중(sell)    → 금액+협의 "50,000원 · 협의 가능", 금액만 "50,000원",
 *                       금액 없이 협의만 "협의"
 */
export function formatPrice(item: PriceInput): string {
  const negotiable = item.price_option === "negotiable";

  if (item.type === "free") {
    return "무료";
  }

  if (item.type === "request") {
    if (negotiable || item.price == null) return "희망가 협의";
    return `희망가 ${won(item.price)}`;
  }

  // sell
  if (item.price != null) {
    return negotiable ? `${won(item.price)} · 협의 가능` : won(item.price);
  }
  return "협의";
}

/**
 * 상대시간 문자열.
 *   방금 전 / N분 전 / N시간 전 / N일 전, 7일 초과면 "M월 D일".
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return "방금 전";
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
