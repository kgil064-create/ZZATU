/**
 * 화면 표시용 공용 상수.
 *
 * ⚠️ 여기 라벨은 "표시용"이다. DB 에 저장되는 items.type 키(sell/free/request)와
 *    Zod 스키마의 enum 값은 이 상수와 무관하게 그대로 유지된다. 라벨만 바꾼다.
 */
import type { TradeType } from "@/lib/format";

/** 거래유형 표시 라벨(화면 전용). */
export const ITEM_TYPE_LABELS: Record<TradeType, string> = {
  sell: "팔아요",
  free: "나눠요",
  request: "구해요",
};

/** 거래완료 라벨(is_sold=true 일 때 거래유형과 무관하게 사용). */
export const SOLD_LABEL = "거래완료";

/**
 * 거래유형 색 단일 소스. 배지와 타입 탭이 함께 참조한다.
 *   - badgeBg / badgeText : 배지 배경 · 글자색
 *   - tabBg               : 타입 탭 "선택" 상태 배경(글자는 항상 흰색)
 * 탭 배경색은 배지 글자색과 동일 값이라 tabBg = badgeText 로 맞춘다.
 * ("전체" 탭은 유형이 아니므로 여기 없음 — 브랜드 청록으로 별도 처리.)
 */
export const ITEM_TYPE_COLORS: Record<
  TradeType,
  { badgeBg: string; badgeText: string; tabBg: string }
> = {
  sell: { badgeBg: "#E1F5EE", badgeText: "#0F6E56", tabBg: "#0F6E56" },
  free: { badgeBg: "#EAF3DE", badgeText: "#3B6D11", tabBg: "#3B6D11" },
  request: { badgeBg: "#FAEEDA", badgeText: "#854F0B", tabBg: "#854F0B" },
};

/** 거래완료 배지 색. */
export const SOLD_BADGE_STYLE = { bg: "#F1EFE8", text: "#5F5E5A" };

/** 상세 페이지 지표 노출 문턱(미달이면 해당 영역 자체를 렌더하지 않음). */
export const VIEW_COUNT_THRESHOLD = 20;
export const FAVORITE_COUNT_THRESHOLD = 1;
