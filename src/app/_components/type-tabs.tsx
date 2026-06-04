"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { TradeType } from "@/lib/format";

const TABS: { label: string; value: TradeType | null }[] = [
  { label: "전체", value: null },
  { label: "구해요", value: "request" },
  { label: "나눔", value: "free" },
  { label: "판매중", value: "sell" },
];

/**
 * 거래종류 필터 탭. (Phase 3 · Client Component)
 *
 * 전체 → "/", 나머지 → "/?type=...". 현재 선택은 ?type= 쿼리로 판정해 primary 강조.
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
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-muted text-muted-foreground")
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
