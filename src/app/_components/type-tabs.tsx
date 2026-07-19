"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { TradeType } from "@/lib/format";
import { ITEM_TYPE_LABELS, ITEM_TYPE_COLORS } from "@/lib/constants";

const TABS: { label: string; value: TradeType | null }[] = [
  { label: "전체", value: null },
  { label: ITEM_TYPE_LABELS.request, value: "request" },
  { label: ITEM_TYPE_LABELS.free, value: "free" },
  { label: ITEM_TYPE_LABELS.sell, value: "sell" },
];

/** "전체" 탭 선택 배경 — 유형이 아니므로 브랜드 청록으로 별도 처리. */
const ALL_TAB_BG = "#0E7C8C";

/** 선택된 탭 배경색: 전체는 브랜드 청록, 유형은 ITEM_TYPE_COLORS.tabBg. */
function activeTabBg(value: TradeType | null): string {
  return value === null ? ALL_TAB_BG : ITEM_TYPE_COLORS[value].tabBg;
}

/**
 * 거래종류 필터 탭. (Phase 3 · Client Component)
 *
 * 전체 → "/", 나머지 → "/?type=...". 현재 선택은 ?type= 쿼리로 판정해 유형별 색으로 강조.
 * 선택된 탭 하나만 색(흰 글씨)이 들어가고, 나머지는 흰 배경+회색 테두리를 유지한다.
 */
export function TypeTabs() {
  const router = useRouter();
  const current = useSearchParams().get("type");

  function go(value: TradeType | null) {
    router.push(value ? `/?type=${value}` : "/");
  }

  return (
    <div className="flex gap-2 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => go(tab.value)}
            aria-pressed={active}
            className={
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
              (active
                ? "text-white"
                : "border border-border bg-muted text-muted-foreground")
            }
            style={active ? { backgroundColor: activeTabBg(tab.value) } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
